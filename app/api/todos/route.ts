import { getPrisma } from "@/lib/prisma";
import { json, readBody, readTitle, withUser } from "@/lib/todos/api";

export async function GET(request: Request) {
  return withUser(request, async (userId) => {
    const todos = await getPrisma().todo.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    return json({ todos });
  });
}

export async function POST(request: Request) {
  return withUser(request, async (userId) => {
    const body = await readBody(request);
    const todo = await getPrisma().todo.create({ data: { userId, title: readTitle(body.title) } });
    return json({ todo }, 201);
  });
}
