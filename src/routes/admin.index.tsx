import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexRedirect,
});

function AdminIndexRedirect() {
  return <Navigate to="/admin/dashboard" />;
}
