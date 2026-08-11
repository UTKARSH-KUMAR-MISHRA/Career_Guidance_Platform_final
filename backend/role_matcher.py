from collections import Counter

class RoleMatcher:
    def __init__(self, data_loader):
        self.data_loader = data_loader

    def find_best_role(self, user_skills):
        best = None
        best_score = -1
        for role in self.data_loader.roles:
            role_skills = role.get("skills", [])
            score = len(set(role_skills) & set(user_skills))
            if score > best_score:
                best_score = score
                best = role
        return {"role": best, "matched_skills": best_score}
