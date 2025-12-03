# WiscFlow | UW Madison Course Reviews

WiscFlow is a modern, community-driven platform for **University of Wisconsin-Madison** students to review courses, visualize prerequisites, and plan their academic journey.

Built with a focus on clean aesthetics and data integrity, WiscFlow combines official catalog data with student-contributed insights.

## ✨ Features

- **Comprehensive Catalog**: Searchable database of 7,000+ UW Madison courses.
- **Advanced Filtering**: Filter by Breadth (Biological, Social Science, etc.), Gen Ed requirements (Comm A/B, QR), and Course Level.
- **Detailed Reviews**: 
  - 4-Dimension Ratings: Content, Teaching, Grading, and Workload.
  - Grade distribution visualization (Green to Red scale).
  - Assessment tagging (Midterms, Projects, Essays).
- **Academic Journey Map**: Visual graph showing prerequisites and "leads to" connections for every course.
- **Hybrid Data Engine**: Seamlessly merges official registrar data with community mock data for a robust user experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Custom WiscFlow Design System)
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma
- **Icons**: Lucide React
- **Authentication**: NextAuth.js (configured for @wisc.edu)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for the database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/franxyang/wiscflow.git
   cd wiscflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the database**
   Ensure Docker Desktop is running, then:
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

This project is a prototype transitioning to production. Contributions are welcome!
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.
