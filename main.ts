import { MongoClient, ObjectId } from "mongodb";
import type { UsuarioModel, TareaModel, ProyectoModel, Usuario, Proyecto, Tarea } from "./types.ts";
import { fromModelToUsuaio, fromModelToTarea, fromModelToProyecto } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("Practica4");

const usuarioCollection = db.collection<UsuarioModel>("usuarios");
const proyectoCollection = db.collection<ProyectoModel>("proyectos");
const tareaCollection = db.collection<TareaModel>("tareas");

const handler = async (req: Request): Promise<Response> => {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;
  
    if (method === "GET") {
        if (path === "/users") {            
              const usersDB = await usuarioCollection.find().toArray();
              const users = await Promise.all(
                usersDB.map((u) => fromModelToUsuaio(u))
              );
              return new Response(JSON.stringify(users));
        } else if (path === "/projects") {            
            const projectsDB = await proyectoCollection.find().toArray();
            const projects = await Promise.all(
                projectsDB.map((u) => fromModelToProyecto(u))
            );
            return new Response(JSON.stringify(projects));
      }else if (path === "/tasks") {            
        const tasksDB = await tareaCollection.find().toArray();
        const tasks = await Promise.all(
            tasksDB.map((u) => fromModelToTarea(u))
        );
        return new Response(JSON.stringify(tasks));
  }else if (path === "/tasks/by-project") {
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return new Response("Bad request: Missing project_id", { status: 400 });
    }

    const tasksDB = await tareaCollection
      .find({ proyect_id: projectId })
      .toArray();

    if (!tasksDB.length) {
      return new Response("No tasks found for the specified project", { status: 404 });
    }

    const tasks = tasksDB.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      created_at: task.created_at,
      due_date: task.due_date,
    }));

    return new Response(JSON.stringify(tasks), { status: 200 });
  } else if (path === "/projects/by-user") {
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response("Bad request: Missing user_id", { status: 400 });
    }

    try {
      const projectsDB = await proyectoCollection
        .find({ user_id: userId })
        .toArray();

      if (!projectsDB.length) {
        return new Response("No projects found for the specified user", { status: 404 });
      }

      const projects = projectsDB.map((project) => ({
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date || null,
      }));

      return new Response(JSON.stringify(projects), { status: 200 });
    } catch (err) {
      return new Response("An error occurred while processing the request", { status: 500 });
    }
  }


        
    } else if (method === "POST") {
        if (path === "/users") {
            const user = await req.json();
            if (!user.name || !user.email ) {
              return new Response("Bad request", { status: 400 });
            }
            const userDB = await usuarioCollection.findOne({
              email: user.email,
            });
            if (userDB) return new Response("User already exists", { status: 409 });
      
            const { insertedId } = await usuarioCollection.insertOne({
              name: user.name,
              email: user.email,
              created_at: new Date(),
            });
      
            return new Response(
              JSON.stringify({
                id: insertedId,
                name: user.name,
                email: user.email,
                created_at: new Date(),                
              }),
              { status: 201 }
            );
          }else if (path === "/projects") {
            const project = await req.json();
            if (!project.name || !project.description ||!project.start_date ||!project.user_id) {
              return new Response("Bad request", { status: 400 });
            }
            const projectDB = await proyectoCollection.findOne({
                name: project.name,
            });
            if (projectDB) return new Response("Project already exists", { status: 409 });
      
            const { insertedId } = await proyectoCollection.insertOne({
              name: project.name,
              description: project.description,
              start_date: project.start_date,
              end_date: project.end_date,
              user_id: project.user_id,
            });
      
            return new Response(
              JSON.stringify({
                id: insertedId,
                name: project.name,
                description: project.description,
                start_date: project.start_date,
                user_id: project.user_id,               
              }),
              { status: 201 }
            );
          }else if (path === "/tasks") {
            const task = await req.json();
            if (!task.title || !task.description ||!task.status ||!task.due_date ||!task.project_id) {
              return new Response("Bad request 1", { status: 400 });
            }
            const taskDB = await tareaCollection.findOne({
                title: task.title,
            });
            if (taskDB) return new Response("Task already exists", { status: 409 });
      
            const { insertedId } = await tareaCollection.insertOne({
              title: task.title,
              description: task.description,
              status: task.status,
              created_at: task.created_at,
              due_date: task.due_date,
              project_id: task.project_id,
            });
      
            return new Response(
              JSON.stringify({
              id: insertedId,
              title: task.title,
              description: task.description,
              status: task.status,
              due_date: task.due_date,
              project_id: task.project_id,              
              }),
              { status: 201 }
            );
          }else if (path === "/tasks/move") {
            const body = await req.json();
            if (!body.task_id || !body.destination_project_id) {
              return new Response("Bad request: Missing required fields", { status: 400 });
            }
        
            const taskDB = await tareaCollection.findOne({ _id: new ObjectId(body.task_id) });
            if (!taskDB) {
              return new Response("Task not found", { status: 404 });
            }
        
            const { modifiedCount } = await tareaCollection.updateOne(
              { _id: new ObjectId(body.task_id) },
              { $set: { project_id: body.destination_project_id } }
            );
        
            if (modifiedCount === 0) {
              return new Response("Failed to move task", { status: 500 });
            }
            
            const updatedTask = await tareaCollection.findOne({ _id: new ObjectId(body.task_id) });
        
            if (updatedTask){return new Response(
              JSON.stringify({
                message: "Task moved successfully.",
                task: {
                  id: updatedTask._id,
                  title: updatedTask.title,
                  description: updatedTask.description,
                  status: updatedTask.status,
                  due_date: updatedTask.due_date,
                  project_id: updatedTask.project_id,
                },
              }),
              { status: 200 }
            );}
          }
    } else if (method === "PUT") {

    } else if (method === "DELETE") {
        if (path === "/users") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Bad request", { status: 400 });
            const { deletedCount } = await usuarioCollection.deleteOne({
              _id: new ObjectId(id),
            });
      
            if (deletedCount === 0) {
              return new Response("User not found", { status: 404 });
            }
      
            return new Response("Delete user", { status: 200 });
          }else if (path === "/projects") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Bad request", { status: 400 });
            const { deletedCount } = await proyectoCollection.deleteOne({
              _id: new ObjectId(id),
            });
      
            if (deletedCount === 0) {
              return new Response("Project not found", { status: 404 });
            }
      
            return new Response("Delete Project", { status: 200 });
          }else if (path === "/tasks") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Bad request", { status: 400 });
            const { deletedCount } = await tareaCollection.deleteOne({
              _id: new ObjectId(id),
            });
      
            if (deletedCount === 0) {
              return new Response("Task not found", { status: 404 });
            }
      
            return new Response("Delete task", { status: 200 });
          }
    }
  
    return new Response("endpoint not found", { status: 404 });
  };
  
  Deno.serve({ port: 8080 }, handler);