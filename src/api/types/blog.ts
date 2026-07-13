// Blog API Types

export interface BlogResponse {
  blogId: number;
  title: string;
  content: string;
  userId: number;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogCreationRequest {
  title: string;
  content: string;
}

export interface BlogUpdateRequest {
  title?: string;
  content?: string;
}
