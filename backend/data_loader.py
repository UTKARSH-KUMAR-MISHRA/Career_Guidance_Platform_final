# backend/data_loader.py
import json
import os

class DataLoader:
    def __init__(self):
        base = os.path.dirname(__file__)
        self.roles = self._load_json(os.path.join(base, "data", "roles.json"))
        self.skills = self._load_json(os.path.join(base, "data", "skills.json"))
        self.roadmaps = self._load_json(os.path.join(base, "data", "roadmaps.json"))
        self.feedback = self._load_json(os.path.join(base, "data", "feedback.json"))

    def _load_json(self, path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_role(self, role_id):
        return next((role for role in self.roles if role.get("id") == role_id), None)

    def get_roles_by_title(self, title):
        matches = []
        for role in self.roles:
            if title.lower() in role.get("title", "").lower():
                matches.append(role)
        return matches

    def get_roadmaps_by_role(self, role_id):
        return [r for r in self.roadmaps if r.get("role_id") == role_id]

# Singleton
data_loader = DataLoader()