import http from "http";
import { URL } from "url";

let todos = [];
let nextId = 1;

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain",
  });

  res.end(text);
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        resolve(parsedBody);
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  const method = req.method;
  const pathname = parsedUrl.pathname;

  // GET /
  if (method === "GET" && pathname === "/") {
    return sendText(res, 200, "Hello World");
  }

  // POST /create/todo
  if (method === "POST" && pathname === "/create/todo") {
    try {
      const body = await getRequestBody(req);

      const newTodo = {
        id: nextId,
        title: body.title,
        description: body.description,
      };

      todos.push(newTodo);
      nextId++;

      return sendJSON(res, 200, todos);
    } catch (error) {
      return sendJSON(res, 400, { error: "Invalid JSON body" });
    }
  }

  // GET /todos
  if (method === "GET" && pathname === "/todos") {
    return sendJSON(res, 200, todos);
  }

  // GET /todo?id=XXX
  if (method === "GET" && pathname === "/todo") {
    const id = Number(parsedUrl.searchParams.get("id"));

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      return sendJSON(res, 404, { error: "Todo not found" });
    }

    return sendJSON(res, 200, todo);
  }

  // DELETE /todo?id=XXX
  if (method === "DELETE" && pathname === "/todo") {
    const id = Number(parsedUrl.searchParams.get("id"));

    const todoIndex = todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      return sendJSON(res, 404, { error: "Todo not found" });
    }

    todos.splice(todoIndex, 1);

    return sendJSON(res, 200, { message: "Todo deleted successfully" });
  }

  // Invalid route
  return sendJSON(res, 404, { error: "Route not found" });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
