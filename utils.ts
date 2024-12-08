import {ObjectId} from "mongodb";
import { Usuario, UsuarioModel } from "./types.ts";
import { Proyecto, ProyectoModel } from "./types.ts";
import { Tarea, TareaModel } from "./types.ts";

export const fromModelToUsuaio = async (
    model: UsuarioModel
): Promise <Usuario> =>{
    return{
        id: model._id!.toString(),
        name: model.name,
        email: model.email,
        created_at: model.created_at,
    };
};

export const fromModelToProyecto = async (
    model: ProyectoModel
): Promise <Proyecto> =>{
    return{
        id: model._id!.toString(),
        name: model.name,
        description: model.description,
        start_date: model.start_date,
        end_date: model.end_date,
        user_id: model.user_id,
    };
};

export const fromModelToTarea = async (
    model: TareaModel
): Promise <Tarea> =>{
    return{
        id: model._id!.toString(),
        title: model.title,
        description: model.description,
        status: model.status,
        created_at: model.created_at,
        due_date: model.due_date,
        project_id: model.project_id,
    };
};