# 🚀 ApexForge – AI-Powered Career Guidance Platform

> **Personalized. Intelligent. Career-Focused.**

ApexForge is an AI-powered career guidance platform designed to help students make informed and personalized career decisions based on their academic background, skills, interests, career goals, and industry requirements.

Unlike traditional career platforms that provide generic recommendations, ApexForge combines **Generative AI, Retrieval-Augmented Generation (RAG), structured career datasets, and personalized analysis** to provide relevant career guidance.

---

## 🎯 Problem Statement

Students, especially those from **Tier-2 and Tier-3 colleges**, often face difficulties in choosing the right career path.

Common challenges include:

- Generic career advice
- Lack of personalized guidance
- Difficulty identifying required skills
- Unclear career roadmaps
- Difficulty finding relevant courses and projects
- Lack of interview preparation
- Limited awareness of current industry trends
- Difficulty identifying personal skill gaps

### 💡 Our Solution

ApexForge provides personalized career guidance by analyzing:

- Academic background
- Branch / specialization
- Current year
- Technical skills
- Soft skills
- Interests
- Career goals
- Target job roles
- Industry trends

The platform then generates **personalized career recommendations, roadmaps, learning resources, projects, and interview preparation guidance.**

---

# ✨ Key Features

### 🤖 AI Career Assistant

An AI-powered career assistant that helps students ask career-related questions and receive context-aware responses using **Retrieval-Augmented Generation (RAG).**

### 🎯 Personalized Career Recommendations

Recommends suitable career paths based on the student's:

- Academic background
- Branch
- Skills
- Interests
- Career goals
- Experience

### 📊 Career & Skill Analysis

Analyzes a student's profile and identifies:

- Existing strengths
- Missing skills
- Recommended skills
- Suitable career roles
- Areas for improvement

### 🗺️ Personalized Career Roadmaps

Provides structured learning roadmaps for different career roles, including required skills, courses, projects, and preparation.

Example:

```text
Python
   ↓
Data Structures & Algorithms
   ↓
Machine Learning
   ↓
Deep Learning
   ↓
NLP
   ↓
Generative AI
   ↓
Projects
   ↓
Internships
   ↓
AI Engineer


📚 Learning Resources

Provides recommendations for:

Courses
Tutorials
Certifications
Documentation
Practice resources
Projects
💼 Project Recommendations

Recommends projects according to:

Career role
Required skills
Difficulty level
Technology stack
🎤 Interview Preparation

Provides role-specific interview preparation including:

Technical questions
Concept-based questions
Role-specific questions
Preparation guidance
📄 Resume Guidance

Provides resume-related guidance and helps students identify important sections and skills for their target roles.

📈 Industry Trends

Provides information about emerging technologies and industry trends to help students understand changing job requirements.

🔄 Career Comparison

Allows students to compare career paths based on:

Required skills
Learning difficulty
Career growth
Job opportunities
Technology requirements
Learning requirements

🧠 AI & RAG Architecture

ApexForge uses a Retrieval-Augmented Generation (RAG) architecture to provide relevant and context-aware career guidance.
                                            ┌─────────────────────┐
                    │    Student Profile  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Career Analysis   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     User Query      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   RAG Retriever     │
                    └──────────┬──────────┘
                               │
                               ▼
             ┌────────────────────────────────┐
             │      Career Knowledge Base     │
             │                                │
             │  Roles                         │
             │  Skills                        │
             │  Courses                       │
             │  Projects                      │
             │  Roadmaps                      │
             │  FAQs                          │
             │  Interview Questions           │
             │  Learning Resources            │
             │  Industry Trends               │
             └───────────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │    Generative AI    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Personalized Answer │
                    └─────────────────────┘

 🔍 RAG Pipeline

The RAG pipeline works through the following stages:

1. Data Collection

Career-related information is collected from structured datasets and documents.

2. Data Processing

The collected data is cleaned, structured, and prepared for retrieval.

3. Document Ingestion

Career information is converted into documents suitable for the RAG pipeline.

4. Embeddings & Vector Storage

The processed information is converted into embeddings and stored in a vector database.
                             Career Data
     ↓
Data Processing
     ↓
Document Creation
     ↓
Embeddings
     ↓
ChromaDB


5. User Query

The student submits a career-related question.

6. Information Retrieval

The RAG retriever searches the knowledge base for the most relevant information.

7. Response Generation

The retrieved context is passed to the Generative AI model to generate a personalized response.

User Query
     ↓
Retriever
     ↓
Relevant Context
     ↓
Generative AI
     ↓
Personalized Response



      🛠️ Technology Stack
Frontend
HTML
CSS
JavaScript
Backend
Python
Flask
REST APIs
Artificial Intelligence
Generative AI
Retrieval-Augmented Generation (RAG)
LangChain
Google Gemini API
Sarvam AI
Database & Storage
ChromaDB
SQLite
CSV
JSON
Data Processing
Pandas
NumPy
Development Tools
Python
VS Code
Git
GitHub
Google Colab
📊 Dataset

ApexForge uses multiple structured datasets to provide comprehensive career guidance.

Dataset	Purpose
roles.csv	             Career roles and job information
skills.csv             	 Technical and soft skills
role_skill_mapping.csv	 Maps skills to career roles
courses.csv	             Recommended courses
projects.csv	         Project recommendations
student_profiles.csv	 Student profile information
roadmap.csv	             Career learning roadmaps
interview_questions.csv	 Interview preparation
career_faq.csv	         Career-related FAQs
learning_resources.csv	 Learning resources
industry_trends.csv	     Industry trends
career_comparison.csv	 Career comparison
resume_checklist.csv	 Resume improvement checklist
soft_skills.csv	         Soft skill information
 

 📂 Project Structure
 AI-Career-Guidance/
│
├── backend/
│   │
│   ├── data/
│   │   ├── roles.csv
│   │   ├── skills.csv
│   │   ├── role_skill_mapping.csv
│   │   ├── courses.csv
│   │   ├── projects.csv
│   │   ├── student_profiles.csv
│   │   ├── roadmap.csv
│   │   ├── interview_questions.csv
│   │   ├── career_faq.csv
│   │   ├── learning_resources.csv
│   │   ├── industry_trends.csv
│   │   ├── career_comparison.csv
│   │   ├── resume_checklist.csv
│   │   └── soft_skills.csv
│   │
│   ├── docs/
│   ├── ocr_models/
│   ├── app.py
│   ├── rag.py
│   ├── ingest.py
│   └── requirements.txt
│
├── frontend/
│   ├── roadmaps/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── .gitignore
├── .gitattributes
└── README.md


⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/UTKARSH-KUMAR-MISHRA/Career_Guidance_Platform_final.git
cd Career_Guidance_Platform_final
2. Create a Virtual Environment
python -m venv .venv
Windows
.venv\Scripts\activate
Linux / macOS
source .venv/bin/activate
3. Install Dependencies
pip install -r backend/requirements.txt
4. Configure Environment Variables

Create:

backend/.env

Add your API configuration:

GEMINI_API_KEY=your_api_key_here
SARVAM_API_KEY=your_api_key_here

⚠️ Never commit API keys or .env files to GitHub.

▶️ Running the Project

Start the backend using the configured entry point.

Example:

python backend/app.py

Then open the frontend according to the project's configuration.


🔐 Security & Privacy

The project follows basic security practices:

API keys are stored using environment variables.
.env files are excluded using .gitignore.
Local databases are excluded where appropriate.
User-uploaded files are excluded from version control.
Sensitive credentials are not hard-coded.

🚀 Future Scope

Future improvements may include:

 AI-powered resume analysis
 LinkedIn profile analysis
 Real-time job recommendations
 Personalized skill scoring
 AI-powered mock interviews
 Voice-based career assistant
 Real-time industry trend integration
 User progress tracking
 Personalized learning dashboard
 Mobile application
 Advanced career prediction models

 🎓 Target Users

ApexForge is designed for:

College students
Final-year students
Fresh graduates
Placement aspirants
Career explorers
Career switchers
Students from Tier-2 and Tier-3 colleges
🌟 Project Highlights
🤖 Generative AI powered
🧠 RAG-based career assistant
🎯 Personalized career recommendations
📊 Skill gap analysis
🗺️ Career roadmaps
📚 Learning resources
💼 Project recommendations
🎤 Interview preparation
📄 Resume guidance
📈 Industry trends
🔄 Career comparison
📋 Structured career datasets