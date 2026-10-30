import { getPrisma } from "@/lib/prisma";
import { checkId, json, readBody, readTitle, TodoError, withUser } from "@/lib/todos/server-utils";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withUser(request, async (userId) => {
    const { id } = await context.params;
    checkId(id);
    const body = await readBody(request);
    const data: { title?: string; completed?: boolean } = {};
    if ("title" in body) data.title = readTitle(body.title);
    if ("completed" in body) {
      if (typeof body.completed !== "boolean") throw new TodoError("完了状態が正しくありません。");
      data.completed = body.completed;
    }
    if (!Object.keys(data).length) throw new TodoError("変更内容を指定してください。");
    const todo = await getPrisma().todo.update({ where: { id, userId }, data });
    return json({ todo });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withUser(request, async (userId) => {
    const { id } = await context.params;
    checkId(id);
    const result = await getPrisma().todo.deleteMany({ where: { id, userId } });
    if (!result.count) throw new TodoError("タスクが見つかりません。", 404);
    return json({ deleted: true });
  });
}
