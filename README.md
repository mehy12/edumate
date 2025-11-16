IEEE Bangalore Section’s Anveshan hackathon.

🚀 Edumate — AI-Driven Collaborative Learning Platform
Edumate is a next-generation, AI-powered collaborative learning platform built for seamless interaction between students, educators, and institutions.
Designed during Anveshan Hackathon – IEEE Bangalore Section, the project focuses on automation, accessibility, and smart learning using modern web technologies.

## ✨ Key Features
### 🎓 Smart Course Management


Create, update, and manage courses effortlessly


AI-generated summaries, learning outcomes, and quizzes


Automated reminders and content updates


### 🤝 Collaborative Learning Tools


Real-time discussions


Peer feedback


Shared workspaces for group projects




          
            
          
        
  
        
    

🧠 AI-Driven Automation


Intelligent notifications


Personalized learning suggestions


Adaptive difficulty quizzes


Automated email + workflow processing via event-driven functions (Inngest)


### 🔐 Secure &amp; Role-Based Access


Students, Teachers, and Admin roles


Session-based authentication


Protected routes &amp; secure APIs


### 🌐 Public/Shareable Course Pages


Share learning materials with anyone


Live previews of lessons &amp; resources




📊 Analytics Dashboard


Track learner progress


Course engagement insights


Real-time system activity logs



## 🏗️ Tech Stack
### Frontend / Fullstack


Next.js (App Router)


TypeScript


TailwindCSS


React Server Components


### Backend


Next.js API Routes


Inngest (for background jobs, workflows)


Prisma (ORM)


PostgreSQL / PlanetScale / NeonDB (any SQL DB)




          
            
          
        
  
        
    

Integrations


ngrok (for secure local webhooks)


Resend / Email API (optional)


Cloud storage (optional)



## 📁 Folder Structure
edumate/
│
├── app/                    # Next.js app router
│   ├── (auth)/             # Auth pages
│   ├── dashboard/          # Role-based dashboards
│   ├── api/                # API endpoints
│   └── layout.tsx
│
├── inngest/                # Inngest functions &amp; workflows
│   ├── index.ts
│   └── handlers/
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/
│
├── components/             # Reusable UI components
├── lib/                    # Utils, configs, helpers
├── public/                 # Assets
│
├── README.md
└── package.json


## ⚙️ Environment Variables
Create a .env file:
DATABASE_URL="your_database_url"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Auth
AUTH_SECRET="your_secret"

# Inngest
INNGEST_EVENT_KEY="your_inngest_event_key"
INNGEST_SIGNING_KEY="your_inngest_signing_key"

# Optional email provider
RESEND_API_KEY="your_resend_key"


## 🚀 Running Locally
### 1️⃣ Install dependencies
npm install
# or
pnpm install

### 2️⃣ Run Prisma migrations
npx prisma generate
npx prisma db push



          
            
          
        
  
        
    

3️⃣ Start local dev server
npm run dev

App runs at: [http://localhost:3000](http://localhost:3000/)

## 🔄 Running Inngest (Background Jobs)
Open second terminal:
npx inngest dev

If using webhooks through ngrok:
ngrok http 3000

Copy your forwarding URL and update:
NEXT_PUBLIC_BASE_URL="https://your-ngrok-url.ngrok-free.app"


## 🧪 Example Workflows
### Auto-Send Welcome Email
Triggered when a user signs up.
### Generate Quiz via AI
Triggered when a teacher creates a new lesson.


Remind Students of Pending Work
Scheduled every midnight.

## 🧩 API Overview
### POST /api/events/user.signup
Triggers onboarding workflow.
### POST /api/courses/create
Create new course with AI-generated metadata.


GET /api/courses/:id
Fetch course with fully populated data.

## 🔥 Troubleshooting
### ❗ TypeError: Cannot read properties of undefined (reading 'toString')
Usually caused by missing or undefined environment variables.
✔ Fix:
Check .env and ensure all required keys are set.

### ❗ Ngrok Errors (ERR_NGROK_107 / ERR_NGROK_320)


Use correct authtoken


Reserved domains belong to specific accounts


Remove custom domain flags if unsure





          
            
          
        
  
        
    

❗ Inngest Not Receiving Webhooks


Ensure ngrok is running


Update NEXT_PUBLIC_BASE_URL


Restart dev servers after change



## 🤝 Contributing
We love contributions! To contribute:


Fork the repo


Create a new branch


Commit your changes


Submit a pull request


Please follow formatting &amp; lint rules.

## 📜 License
This project is open-source under the MIT License.

## 🏆 Built for Anveshan – IEEE Bangalore Section Hackathon
Edumate was created with the vision of empowering next-generation learners using open-source, scalable, AI-powered tools.

Just tell me!
