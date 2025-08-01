import { Hono } from "hono";

type Variables = {
  troop: { id: string; name: string; slug: string };
  user: {
    id: string;
    role: string;
    troopId: string;
    username: string;
    email: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

// Placeholder routes - will be implemented in auth system task
app.post("/login", async (c) => {
  return c.json({ message: "Login endpoint - TODO: implement authentication" });
});

app.post("/register", async (c) => {
  return c.json({ message: "Register endpoint - TODO: implement authentication" });
});

app.get("/me", async (c) => {
  return c.json({ message: "User profile endpoint - TODO: implement authentication" });
});

app.post("/logout", async (c) => {
  return c.json({ message: "Logout endpoint - TODO: implement authentication" });
});

export default app;