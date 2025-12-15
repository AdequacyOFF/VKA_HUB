import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import { AuthCheck } from '@/components/AuthCheck';
import { ProfileCompletionCheck } from '@/components/ProfileCompletionCheck';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ModeratorLayout } from '@/layouts/ModeratorLayout';

// Pages
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { Recovery } from '@/pages/Auth/Recovery';
import { Profile } from '@/pages/Profile/Profile';
import { UsersList } from '@/pages/Users/UsersList';
import { UserDetail } from '@/pages/Users/UserDetail';
import { TeamsList } from '@/pages/Teams/TeamsList';
import { TeamDetail } from '@/pages/Teams/TeamDetail';
import { CreateTeam } from '@/pages/Teams/CreateTeam';
import { EditTeam } from '@/pages/Teams/EditTeam';
import { TeamReports } from '@/pages/Teams/TeamReports';
import { TeamRequests } from '@/pages/Teams/TeamRequests';
import { CompetitionsList } from '@/pages/Competitions/CompetitionsList';
import { CompetitionDetail } from '@/pages/Competitions/CompetitionDetail';
import RegisterTeam from '@/pages/Competitions/RegisterTeam';
import SubmitCompetitionReport from '@/pages/Competitions/SubmitCompetitionReport';
import { ModeratorDashboard } from '@/pages/Moderator/ModeratorDashboard';
import { ModeratorUsers } from '@/pages/Moderator/ModeratorUsers';
import { ModeratorTeams } from '@/pages/Moderator/ModeratorTeams';
import { ModeratorCompetitions } from '@/pages/Moderator/ModeratorCompetitions';
import CreateCompetition from '@/pages/Moderator/CreateCompetition';
import { ModeratorReports } from '@/pages/Moderator/ModeratorReports';
import { ModeratorModerators } from '@/pages/Moderator/ModeratorModerators';
import { ModeratorAnalytics } from '@/pages/Moderator/ModeratorAnalytics';
import { CreateComplaint } from '@/pages/Complaints/CreateComplaint';
import { CreatePlatformComplaint } from '@/pages/PlatformComplaints/CreatePlatformComplaint';
import { ModeratorPlatformComplaints } from '@/pages/Moderator/ModeratorPlatformComplaints';

const router = createBrowserRouter(
  [
    {
      path: '/auth',
      element: (
        <AuthCheck requireAuth={false}>
          <AuthLayout />
        </AuthCheck>
      ),
      children: [
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: 'recovery', element: <Recovery /> },
      ],
    },
  {
    path: '/',
    element: (
      <AuthCheck requireAuth={true}>
        <ProfileCompletionCheck>
          <MainLayout />
        </ProfileCompletionCheck>
      </AuthCheck>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'profile', element: <Profile /> },
      { path: 'users', element: <UsersList /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'teams', element: <TeamsList /> },
      { path: 'teams/create', element: <CreateTeam /> },
      { path: 'teams/:id', element: <TeamDetail /> },
      { path: 'teams/:id/edit', element: <EditTeam /> },
      { path: 'teams/:id/reports', element: <TeamReports /> },
      { path: 'teams/:id/requests', element: <TeamRequests /> },
      { path: 'competitions', element: <CompetitionsList /> },
      { path: 'competitions/:id', element: <CompetitionDetail /> },
      { path: 'competitions/:id/register', element: <RegisterTeam /> },
      { path: 'competitions/:competitionId/registrations/:registrationId/report', element: <SubmitCompetitionReport /> },
      { path: 'complaints/create', element: <CreateComplaint /> },
      { path: 'platform-complaints/create', element: <CreatePlatformComplaint /> },
    ],
  },
  {
    path: '/moderator',
    element: (
      <AuthCheck requireAuth={true}>
        <RoleProtectedRoute>
          <ModeratorLayout />
        </RoleProtectedRoute>
      </AuthCheck>
    ),
    children: [
      { index: true, element: <ModeratorDashboard /> },
      { path: 'users', element: <ModeratorUsers /> },
      { path: 'teams', element: <ModeratorTeams /> },
      { path: 'competitions', element: <ModeratorCompetitions /> },
      { path: 'competitions/create', element: <CreateCompetition /> },
      { path: 'reports', element: <ModeratorReports /> },
      { path: 'platform-complaints', element: <ModeratorPlatformComplaints /> },
      { path: 'moderators', element: <ModeratorModerators /> },
      { path: 'analytics', element: <ModeratorAnalytics /> },
    ],
  },
]
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
