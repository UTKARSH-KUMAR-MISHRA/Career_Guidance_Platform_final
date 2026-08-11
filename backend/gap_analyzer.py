class GapAnalyzer:
    def __init__(self, data_loader):
        self.data_loader = data_loader

    def analyze(self, role_id, current_skills):
        role = self.data_loader.get_role(role_id)
        if not role:
            return {"error": "Role not found"}
        required_skills = set(role.get("skills", []))
        current_skills = set(current_skills)
        missing = list(required_skills - current_skills)
        return {
            "role": role,
            "missing_skills": missing,
            "current_skills": list(current_skills),
        }
