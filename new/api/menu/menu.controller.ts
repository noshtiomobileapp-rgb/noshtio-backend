import { Request, Response } from "express";
import { MenuService } from "../../domain/menu/menu.service";

export class MenuController {
  private service = new MenuService();

  getAll = async (req: Request, res: Response) => {
    const menus = await this.service.findAll();
    return res.json({ success: true, data: menus });
  };

  getById = async (req: Request, res: Response) => {
    const menu = await this.service.findById(req.params.id);
    return res.json({ success: true, data: menu });
  };

  create = async (req: Request, res: Response) => {
    const menu = await this.service.create(req.body);
    return res.json({ success: true, data: menu });
  };

  update = async (req: Request, res: Response) => {
    const menu = await this.service.update(req.params.id, req.body);
    return res.json({ success: true, data: menu });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    return res.json({ success: true, message: "Menu deleted" });
  };
}
