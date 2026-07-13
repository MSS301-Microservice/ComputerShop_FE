// Category API Types

export interface CategoryResponse {
  categoryId: number;
  categoryName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTreeNode {
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  children: CategoryTreeNode[] | null;
}

export interface CategoryRequest {
  categoryName: string;
  description?: string;
}
