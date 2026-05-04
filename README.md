# Student Portal

A comprehensive student portal application built with Next.js, featuring article management, user authentication, notifications, and admin functionality.

## Features

- **User Authentication**: Login/signup for students and admins
- **Article Management**: Create, read, like, and comment on articles
- **Real-time Notifications**: Get notified of new comments, likes, and articles
- **Admin Dashboard**: Manage users, articles, comments, and notifications
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (for auth), Local Storage (for articles/data)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vancabs/labexer3.git
cd student-portal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. Push your code to GitHub (already done)
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository: `vancabs/labexer3`
5. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables when prompted or in the Vercel dashboard.

## Project Structure

```
student-portal/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── articles/          # Articles pages
│   ├── auth/              # Authentication pages
│   └── dashboard/         # User dashboard
├── lib/                   # Utility libraries
│   ├── article-store.ts   # Article data management
│   ├── auth-helper.ts     # Authentication helpers
│   └── notifications.ts   # Notification system
├── public/                # Static assets
└── vercel.json           # Vercel deployment config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

The application requires the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.
