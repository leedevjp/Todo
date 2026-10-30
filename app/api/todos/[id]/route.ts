import { getPrisma } from "@/lib/prisma";
import { checkId, json, readBody, readTitle, TodoError, withUser } from "@/lib/todos/api";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withUser(request, async (userId) => {
    const { id } = await context.params;
    checkId(id);
    const body = await readBody(request);
    const data: { title?: string; completed?: boolean } = {};
    if ("title" in body) data.title = readTitle(body.title);
    if ("completed" in body) {
      if (typeof body.completed !== "boolean") throw new TodoError("완료 상태가 올바르지 않아요.");
      data.completed = body.completed;
    }
    if (!Object.keys(data).length) throw new TodoError("변경할 내용을 입력해 주세요.");
    const todo = await getPrisma().todo.update({ where: { id, userId }, data });
    return json({ todo });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withUser(request, async (userId) => {
    const { id } = await context.params;
    checkId(id);
    const result = await getPrisma().todo.deleteMany({ where: { id, userId } });
    if (!result.count) throw new TodoError("할 일을 찾을 수 없어요.", 404);
    return json({ deleted: true });
  });
}
