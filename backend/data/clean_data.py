# backend/data/clean_data.py (EXTENDED)
import pandas as pd
import os

RAW_DIR = "raw"
OUTPUT_DIR = "."
DOCS_DIR = "../docs/"

print("🔄 Starting COMPLETE Data Cleaning Pipeline...")
os.makedirs(DOCS_DIR, exist_ok=True)

# ---------- HELPER: find column ----------
def find_column(df, possible_names):
    for name in possible_names:
        if name in df.columns:
            return name
    return None

# ---------- HELPER: Convert any CSV to Markdown (if it has text columns) ----------
def csv_to_markdown(df, filename, title, id_col=None, text_cols=None):
    df.columns = df.columns.str.strip()
    
    # If no specific text columns provided, use all columns to build a description
    if not text_cols:
        text_cols = df.columns.tolist()
    
    with open(f"{DOCS_DIR}/{filename}", "w") as f:
        f.write(f"# {title}\n\n")
        for _, row in df.iterrows():
            # Use the first column as a header if it looks like an ID/Name
            header = row[df.columns[0]] if df.columns[0] in row else "Item"
            f.write(f"## {header}\n")
            
            for col in text_cols:
                if col in row and pd.notna(row[col]):
                    f.write(f"- **{col}:** {row[col]}\n")
            f.write("\n")
    print(f"✅ {filename} created")

# ---------- 1. LOAD CORE CSVs (Existing Logic) ----------
roles_df = pd.read_csv(f"{RAW_DIR}/roles.csv")
roles_df.columns = roles_df.columns.str.strip()
role_id_col = find_column(roles_df, ['id', 'role_id'])
if role_id_col and role_id_col != 'id':
    roles_df.rename(columns={role_id_col: 'id'}, inplace=True)
roles_df["description"] = roles_df["description"].fillna("No description available.")
print(f"✅ roles.csv loaded: {len(roles_df)} records")

skills_df = pd.read_csv(f"{RAW_DIR}/skills.csv")
skills_df.columns = skills_df.columns.str.strip()
print(f"✅ skills.csv loaded: {len(skills_df)} records")

roadmap_df = pd.read_csv(f"{RAW_DIR}/roadmap.csv")
roadmap_df.columns = roadmap_df.columns.str.strip()
print(f"✅ roadmap.csv loaded: {len(roadmap_df)} records")

# ---------- 2. MERGE ROLE SKILLS ----------
mapping_df = pd.read_csv(f"{RAW_DIR}/role_skill_mapping.csv")
mapping_df.columns = mapping_df.columns.str.strip()
mapping_with_names = mapping_df.merge(skills_df[['skill_id', 'skill_name']], on='skill_id', how='left')
required_skills = mapping_with_names.groupby('role_id')['skill_name'].apply(list).reset_index()
required_skills.columns = ['id', 'required_skills']
roles_df = roles_df.merge(required_skills, on='id', how='left')
roles_df['required_skills'] = roles_df['required_skills'].apply(lambda x: x if isinstance(x, list) else [])
print(f"✅ role_skill_mapping merged: {len(required_skills)} roles have skills")

# ---------- 3. MERGE BRANCH RELEVANCE ----------
branch_df = pd.read_csv(f"{RAW_DIR}/branch_role_mapping.csv")
branch_df.columns = branch_df.columns.str.strip()
branch_role_col = find_column(branch_df, ['role_id', 'id'])
branch_code_col = find_column(branch_df, ['branch_code', 'branch'])
if branch_role_col and branch_code_col:
    if 'priority' in branch_df.columns:
        branch_df['priority'] = pd.to_numeric(branch_df['priority'], errors='coerce').fillna(0.5)
        branch_df['weight'] = branch_df['priority'] / branch_df['priority'].max() if branch_df['priority'].max() > 0 else 0.5
    else:
        branch_df['weight'] = branch_df['recommended'].apply(lambda x: 1.0 if str(x).lower() in ['yes', '1'] else 0.1)
    branch_relevance = branch_df.groupby(branch_role_col).apply(
        lambda x: {row[branch_code_col]: row['weight'] for _, row in x.iterrows()}
    ).reset_index()
    branch_relevance.columns = ['id', 'branch_relevance']
    roles_df = roles_df.merge(branch_relevance, on='id', how='left')
    roles_df['branch_relevance'] = roles_df['branch_relevance'].apply(lambda x: x if isinstance(x, dict) else {})
print(f"✅ branch_role_mapping merged")

# ---------- 4. SAVE CORE JSONS ----------
roles_df.to_json(f"{OUTPUT_DIR}/roles.json", orient="records", indent=2)
print(f"✅ roles.json saved ({len(roles_df)} records)")
skills_df.to_json(f"{OUTPUT_DIR}/skills.json", orient="records", indent=2)
print(f"✅ skills.json saved ({len(skills_df)} records)")
roadmap_df.to_json(f"{OUTPUT_DIR}/roadmaps.json", orient="records", indent=2)
print(f"✅ roadmaps.json saved ({len(roadmap_df)} records)")

# ============================================================
# 5. NEW: CONVERT ALL UNTOUCHED CSVs TO MARKDOWN (FOR RAG)
# ============================================================
print("\n--- Converting Enrichment CSVs to Markdown (For RAG) ---")

# Map CSV filename -> (Markdown filename, Title, optional text columns)
extra_files = {
    "career_faq.csv": ("career_faq.md", "Career FAQs", None),
    "interview_questions.csv": ("interview_questions.md", "Interview Questions", None),
    "career_comparison.csv": ("career_comparison.md", "Career Comparisons", None),
    "certifications.csv": ("certifications.md", "Certifications by Role", None),
    "industry_trends.csv": ("industry_trends.md", "Industry Trends & Demand", None),
    "resume_checklist.csv": ("resume_checklist.md", "Resume & CV Tips", None),
    "soft_skills.csv": ("soft_skills.md", "Essential Soft Skills", None),
    "learning_resources.csv": ("learning_resources.md", "Learning Resources", None),
    "projects.csv": ("projects.md", "Beginner Projects", None),
    "courses.csv": ("courses.md", "Recommended Courses", None),
    "colleges_dataset_800.csv": ("colleges.md", "Top Engineering Colleges", None),
    "nirf_2025_Sheet1.csv": ("nirf_ranking.md", "NIRF 2025 Rankings", None),
}

for csv_file, (md_file, title, text_cols) in extra_files.items():
    csv_path = f"{RAW_DIR}/{csv_file}"
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
            csv_to_markdown(df, md_file, title, text_cols)
        except Exception as e:
            print(f"⚠️ Could not process {csv_file}: {e}")
    else:
        print(f"⚠️ {csv_file} not found, skipping.")

print("\n🎉 COMPLETE Data Cleaning Finished!")
print(f"   - JSONs updated in: {OUTPUT_DIR}/")
print(f"   - RAG Markdowns updated in: {DOCS_DIR}/")