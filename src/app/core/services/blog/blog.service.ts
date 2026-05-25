import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: { name: string };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl.customer;

  getPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.api}/blog`);
  }

  getPost(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.api}/blog/${slug}`);
  }
}
