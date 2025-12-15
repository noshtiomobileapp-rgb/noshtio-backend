import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../../domain/category/category.service";
import { ICategory } from "../../domain/category/category.types";

export class CategoryController {
  private service = new CategoryService();

  // GET /category
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.service.findAll();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  };

  // GET /category/:id
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await this.service.findById(id);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (err) {
      next(err);
    }
  };

  // POST /category
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: ICategory = req.body;
      const created = await this.service.create(payload);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  // PUT /category/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload: Partial<ICategory> = req.body;

      const updated = await this.service.update(id, payload);
      if (!updated) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  // DELETE /category/:id
  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deleted = await this.service.delete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
