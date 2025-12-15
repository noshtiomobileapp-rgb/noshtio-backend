import { CategoryModel } from "./category.model";
import { ICategory } from "./category.types";

export class CategoryService {
  /** Get all categories */
  async findAll() {
    return CategoryModel.find();
  }

  /** Get category by ID */
  async findById(id: string) {
    return CategoryModel.findById(id);
  }

  /** Get category by name (case-insensitive) */
  async findByName(name: string) {
    return CategoryModel.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });
  }

  /** Create new category */
  async create(data: ICategory) {
    return CategoryModel.create(data);
  }

  /** Update category */
  async update(id: string, data: Partial<ICategory>) {
    return CategoryModel.findByIdAndUpdate(id, data, { new: true });
  }

  /** Delete category */
  async delete(id: string) {
    return CategoryModel.findByIdAndDelete(id);
  }

  /** Bulk create categories from OCR */
  async createFromOCR(categories: ICategory[]) {
    return CategoryModel.insertMany(categories);
  }
}
