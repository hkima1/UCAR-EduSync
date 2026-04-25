import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/director/")({
  component: DirectorIndexRedirect,
});

function DirectorIndexRedirect() {
  return <Navigate to="/director/dashboard" />;
}
