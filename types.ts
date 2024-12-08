import { ObjectId, type OptionalId } from "mongodb";

export type UsuarioModel = OptionalId<{
    _id: ObjectId;
    name: string;
    email: string;
    created_at: Date;
}>;

export type ProyectoModel = OptionalId<{
    _id: ObjectId;
    name: string;
    description: string;
    start_date: Date;
    end_date: Date;
    user_id: ObjectId;
}>;

export type TareaModel = OptionalId<{
    _id: ObjectId;
    title: string;
    description: string;
    status: string;
    created_at: Date;
    due_date: Date;
    project_id: ObjectId;
}>;

export type Usuario = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
};

export type Proyecto = {
    id: string;
    name: string;
    description?: string;
    start_date: Date;
    end_date?: Date;
    user_id: ObjectId;
};

export type Tarea = {
    id: string;
    title: string;
    description?: string;
    status: string;
    created_at: Date;
    due_date?: Date;
    project_id: ObjectId;
};