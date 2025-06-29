import os
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load database variable from .env file
load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Flask app setup 
app = Flask(__name__)
engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}")

# Load and preprocess pop catalog 
all_pops = pd.read_sql("""
    SELECT pop_id, pop_name, serial_number, category, sub_category, picture, release_year
    FROM pop_catalog
""", engine)

all_pops['release_year'] = pd.to_numeric(all_pops['release_year'], errors='coerce').fillna(0).astype(int)

# Prints for debugging Database connection and queries 
# print(" Loaded pop_catalog pop_ids:", all_pops['pop_id'].tolist())
# print(f" Total POPs in catalog: {len(all_pops)}")

# Build feature matrix 
# category weight = 1
cat_dummies = pd.get_dummies(all_pops['category'], prefix='cat') 
# sub_category weight = 1.5
sub_dummies = pd.get_dummies(all_pops['sub_category'], prefix='sub') * 1.5 
# normalized release_year weight = 0.75
year_norm = ((all_pops['release_year'] - all_pops['release_year'].min()) / (all_pops['release_year'].max() - all_pops['release_year'].min())).fillna(0) * 0.75 

features = pd.concat([cat_dummies, sub_dummies, year_norm.rename('year')], axis=1)

# Fit NearestNeighbors model 
nn = NearestNeighbors(n_neighbors=20, metric='cosine')
nn.fit(features.values)

# Recommendation logic - top 10 pops
def recommend_for_user(user_id, top_k=10):
    with engine.connect() as conn:
        owned = pd.read_sql("SELECT pop_id FROM personal_collection WHERE user_id=%s", conn, params=(user_id,))
        wish  = pd.read_sql("SELECT pop_id FROM wishlist WHERE user_id=%s", conn, params=(user_id,))

    owned_ids = owned['pop_id'].tolist()
    wish_ids = wish['pop_id'].tolist()

    # Debugging
    # print(f"\n Getting recommendations for user_id={user_id}")
    # print(f"  User owns: {owned_ids}")
    # print(f" User wishlist: {wish_ids}")

    # minimum 1 funko pop needed to recommend other funko pops
    if not owned_ids:
        print(" User's collection is empty, returning empty list")
        return []

    id_to_idx = dict(zip(all_pops.pop_id, range(len(all_pops))))
    owned_idxs = [id_to_idx[pid] for pid in owned_ids if pid in id_to_idx]

    print(f" Valid owned pop indexes in catalog: {owned_idxs}")
    if not owned_idxs:
        print(" None of the owned POPs matched the catalog.")
        return []

    # Averaged user profile vector
    user_vector = features.values[owned_idxs].mean(axis=0).reshape(1, -1)

    distances, indices = nn.kneighbors(user_vector, return_distance=True)

    # Score neighbors
    scores = {}
    for dist, idx in zip(distances[0], indices[0]):
        pid = all_pops.at[idx, 'pop_id']
        if pid in owned_ids or pid in wish_ids:
            continue
        scores[pid] = 1 - dist  # cosine similarity

    recs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top = [pid for pid, _ in recs[:top_k]]
    return all_pops[all_pops.pop_id.isin(top)].to_dict(orient='records')

# API endpoint
@app.route('/api/catalog/knn-suggestions', methods=['GET'])
def knn_suggestions():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    recs = recommend_for_user(user_id)
    return jsonify(recs), 200

# Run server 
if __name__ == '__main__':
    app.run(port=6000, debug=True)
