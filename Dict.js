const DIRECTOR_DATA = {
    tabs: [
        {
            id: 'tab-movies',
            label: 'ENTERTAINMENT',
            type: 'simple-grid',
            links: [
                { name: "YouTube", url: "https://www.youtube.com/", desc: "Video Streaming Platform" },
                { name: "Anna's Archive", url: "https://annas-archive.org/", desc: "Library & Books Search" },
                { name: "Pinterest", url: "https://in.pinterest.com/", desc: "Visual Discovery Engine" },
                { name: "Clash of Clans", url: "https://store.supercell.com/clashofclans", desc: "Mobile Strategy Game" },
                { name: "Carrom Pool", url: "https://m.apkpure.com/carrom-pool/com.miniclip.carrom", desc: "Disc Game" },
                { name: "FMHY", url: "https://fmhy.net/", desc: "Free Media Heck Yeah" }
            ]
        },
        {
            id: 'tab-identity',
            label: 'IDENTITY',
            type: 'profile',
            profile: {
                name: "System User",
                role: "Admin Level 5",
                id: "#8839",
                status: "ONLINE",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            }
        },
        {
            id: 'tab-system',
            label: 'SYSTEM',
            type: 'diagnostics',
            data: { cpu: "34%", mem: "12%", uptime: "4d 12h", ver: "2.4.0" }
        },
        {
            id: 'tab-ai',
            label: 'AI TOOLS',
            type: 'category-grid',
            categories: [
                {
                    title: "1. AI CHAT & MODELS",
                    desc: "Chatbots, LLMs, and AI Interfaces",
                    links: [
                        { name: "Poe", url: "https://poe.com/", desc: "Multi-model AI Chat" },
                        { name: "Venice AI", url: "https://venice.ai/", desc: "Uncensored AI Chat" },
                        { name: "Qwen Chat", url: "https://chat.qwen.ai/", desc: "Alibaba's LLM Chat" },
                        { name: "Hugging Face", url: "https://huggingface.co/", desc: "AI Community & Models" },
                        { name: "Llama-2 7B", url: "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF", desc: "Open Source LLM" },
                        { name: "Eliza OS", url: "https://github.com/elizaOS/eliza", desc: "Autonomous Agents Framework" },
                        { name: "Llama Coder", url: "https://llamacoder.together.ai/", desc: "AI Code Generator" }
                    ]
                },
                {
                    title: "2. AI IMAGE & CREATIVE",
                    desc: "Generative Art, Design, and Media",
                    links: [
                        { name: "Pixelcut Uncrop", url: "https://www.pixelcut.ai/uncrop", desc: "AI Image Expander" },
                        { name: "Fooocus", url: "https://github.com/lllyasviel/Fooocus", desc: "Image Generation Software" },
                        { name: "Hyper3D (Rodin)", url: "https://hyper3d.ai/rodin/", desc: "AI 3D Model Generator" },
                        { name: "Watermark Remover", url: "https://www.watermarkremover.io/upload", desc: "Remove Watermarks" },
                        { name: "AI Logo Maker", url: "https://ailogomaker.io/en/app", desc: "Generate Custom Logos" },
                        { name: "Canva", url: "https://www.canva.com/", desc: "Design Platform" }
                    ]
                },
                {
                    title: "3. AI JOBS & ANNOTATION",
                    desc: "Work opportunities in AI training",
                    links: [
                        { name: "DataAnnotation", url: "https://dataannotation.tech/", desc: "AI Training Jobs" },
                        { name: "UHRS Marketplace", url: "https://www.uhrs.ai/", desc: "Micro-task Platform" },
                        { name: "Rex.zone", url: "https://www.rex.zone/open-opportunities", desc: "AI Data Labeling Jobs" },
                        { name: "Remotasks", url: "https://www.rex.zone/jobs/ai%20data%20labeling%20jobs", desc: "AI Data Tasks" }
                    ]
                }
            ]
        },
        {
            id: 'tab-jobs',
            label: 'CAREERS',
            type: 'category-grid',
            categories: [
                {
                    title: "1. JOB PORTALS",
                    desc: "Major platforms for job hunting",
                    links: [
                        { name: "LinkedIn", url: "https://www.linkedin.com/", desc: "Professional Network" },
                        { name: "Naukri.com", url: "https://www.naukri.com/", desc: "Indian Job Portal" },
                        { name: "Wellfound", url: "https://wellfound.com/", desc: "Startup Jobs" },
                        { name: "Dice", url: "https://www.dice.com/", desc: "Tech Jobs" },
                        { name: "Startup.jobs", url: "https://startup.jobs/", desc: "Startup Careers" },
                        { name: "Working Nomads", url: "https://www.workingnomads.com/jobs", desc: "Remote Jobs" },
                        { name: "GoodSpace", url: "https://goodspace.ai/member/dashboard", desc: "AI Recruitment" }
                    ]
                },
                {
                    title: "2. INTERNSHIPS",
                    desc: "Programs for students and freshers",
                    links: [
                        { name: "AICTE Internship", url: "https://internship.aicte-india.org/", desc: "National Portal" },
                        { name: "Cognifyz", url: "https://cognifyz.com/internships/", desc: "Data Science Internships" },
                        { name: "Kulturehire", url: "https://kulturehire.com/", desc: "Real-world Internships" },
                        { name: "Rooman Tech", url: "https://rooman.com/internship/ai-data-analyst/", desc: "AI Data Analyst" },
                        { name: "Foresight BI", url: "https://training.foresightbi.com.ng/courses/power-bi-developer-internship", desc: "Power BI Dev" }
                    ]
                },
                {
                    title: "3. SPECIFIC OPENINGS",
                    desc: "Direct links to specific hiring challenges",
                    links: [
                        { name: "Deloitte USI", url: "https://usijobs.deloitte.com/", desc: "Business Analyst Roles" },
                        { name: "TheMathCompany", url: "https://jobs.weekday.works/themathcompany-trainee-analyst", desc: "Trainee Analyst" },
                        { name: "Shadowfax", url: "https://www.hackerearth.com/challenges/new/competitive/shadowfax-hack-o-thon/", desc: "Data Warriors Challenge" },
                        { name: "Securonix", url: "https://mycareernet.in/mycareernet/contests/Securonix-SECUROTHON-2025", desc: "Software Engineer Challenge" },
                        { name: "Indium Software", url: "https://careers.indiumsoft.com/", desc: "Trainee - Data AI" }
                    ]
                }
            ]
        },
        {
            id: 'tab-dev',
            label: 'DEV & DATA',
            type: 'category-grid',
            categories: [
                {
                    title: "1. GITHUB PROJECTS",
                    desc: "Open source repositories and code",
                    links: [
                        { name: "Solar Panel Cleaning", url: "https://github.com/The-Semicolons/AI-Based-Solar-Panel-Cleaning-System", desc: "AI Automation Project" },
                        { name: "Clean Energy Robot", url: "https://github.com/adnanO999/CleanEnergy", desc: "Solar Panel Robot" },
                        { name: "Python Projects", url: "https://github.com/Mrinank-Bhowmick/python-beginner-projects", desc: "Beginner Collection" },
                        { name: "100 Days of ML", url: "https://github.com/Avik-Jain/100-Days-Of-ML-Code", desc: "ML Learning Path" },
                        { name: "Nova Assistant", url: "https://github.com/naveed-gung/nova", desc: "Voice Assistant" }
                    ]
                },
                {
                    title: "2. DATA SCIENCE",
                    desc: "Datasets, Notebooks, and Analytics",
                    links: [
                        { name: "Kaggle", url: "https://www.kaggle.com/", desc: "Data Science Community" },
                        { name: "OpenML", url: "https://www.openml.org/", desc: "ML Datasets" },
                        { name: "Google Colab", url: "https://colab.research.google.com/", desc: "Python Notebooks" },
                        { name: "TensorTonic", url: "https://www.tensortonic.com/", desc: "Learn ML Code" },
                        { name: "Movie Rental Analysis", url: "https://github.com/virajbhutada/bi-projects-collection/", desc: "Power BI Project" }
                    ]
                },
                {
                    title: "3. DEV TOOLS",
                    desc: "Utilities and Development Resources",
                    links: [
                        { name: "Bolt.new", url: "https://bolt.new/", desc: "Web Dev in Browser" },
                        { name: "Awesome Lists", url: "https://github.com/sindresorhus/awesome", desc: "Curated Lists" },
                        { name: "Open Source Alt", url: "https://www.opensourcealternative.to/", desc: "Software Alternatives" },
                        { name: "DorkSearch PRO", url: "https://dorksearch.pro/", desc: "Google Dorks Generator" },
                        { name: "Filestash", url: "https://www.filestash.app/", desc: "Online File Manager" }
                    ]
                }
            ]
        },
        {
            id: 'tab-learn',
            label: 'LEARNING',
            type: 'category-grid',
            categories: [
                {
                    title: "1. COURSES & TUTORIALS",
                    desc: "Platforms for online education",
                    links: [
                        { name: "StudyBullet", url: "https://studybullet.com/", desc: "Course Enrollments" },
                        { name: "Course Kingdom", url: "https://coursekingdom.xyz/", desc: "Free Courses" },
                        { name: "DiscUdemy", url: "https://www.discudemy.com/all", desc: "Udemy Coupons" },
                        { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/", desc: "Coding Tutorials" },
                        { name: "Swayam", url: "https://swayam.gov.in/", desc: "Indian Govt Courses" }
                    ]
                },
                {
                    title: "2. RESOURCES",
                    desc: "Books, Articles, and Archives",
                    links: [
                        { name: "Internet Archive", url: "https://archive.org/", desc: "Digital Library" },
                        { name: "Find My Course", url: "https://findmycourse.in/", desc: "Course Finder" },
                        { name: "Simplilearn", url: "https://www.simplilearn.com/", desc: "Skill Certification" },
                        { name: "Interview Lift", url: "https://www.interviewlift.com/downloads", desc: "Interview Prep" }
                    ]
                }
            ]
        }
    ]
};