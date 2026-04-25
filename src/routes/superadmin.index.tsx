import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/superadmin/")({
  component: SuperAdminIndexRedirect,
});

function SuperAdminIndexRedirect() {
  return <Navigate to="/superadmin/dashboard" />;
}
