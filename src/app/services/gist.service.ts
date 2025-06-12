// src/app/services/gist.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams, // Import HttpParams
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators'; // Import map if not already there

// Keep your existing Gist interface here
export interface Gist {
  id: string;
  description: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  } | null;
  updated_at: string;
  files: {
    [key: string]: {
      filename: string;
      type: string;
      language: string;
      raw_url: string;
      size: number;
      content?: string; // Keep optional content property
    };
  };
  // GitHub search results also include score, though we might not use it
  score?: number;
}

// Interface for GitHub Search Gists API response
interface GistSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Gist[]; // The actual gist results
}

@Injectable({
  providedIn: 'root',
})
export class GistService {
  private apiUrl = 'https://api.github.com';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => error);
  }

  // Method to get public gists (used when there's no search term)
  getPublicGists(page: number = 1, perPage: number = 10): Observable<Gist[]> {
    const headers = new HttpHeaders({
      Accept: 'application/vnd.github.v3+json',
      // Remove 'User-Agent': 'Angular-Gist-App', // As discussed before, remove unsafe header
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http
      .get<Gist[]>(`${this.apiUrl}/gists/public`, { headers, params })
      .pipe(retry(1), catchError(this.handleError));
  }

  // New method to get a user's gists (authenticated user)
  getUserGists(page: number = 1, perPage: number = 10): Observable<Gist[]> {
    // No need for explicit headers if an interceptor handles authentication
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // This endpoint returns gists for the authenticated user
    return this.http
      .get<Gist[]>(`${this.apiUrl}/gists`, { params })
      .pipe(retry(1), catchError(this.handleError));
  }

  // New method to search gists
  searchGists(
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<GistSearchResponse> {
    const headers = new HttpHeaders({
      Accept: 'application/vnd.github.v3+json',
      // Remove 'User-Agent': 'Angular-Gist-App',
    });

    let params = new HttpParams()
      .set('q', query) // Search query parameter
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // GitHub search API returns a different structure (total_count, items)
    return this.http
      .get<GistSearchResponse>(`${this.apiUrl}/search/gists`, {
        headers,
        params,
      })
      .pipe(retry(1), catchError(this.handleError));
  }

  // Method to get details of a single gist by ID
  getGistDetails(gistId: string): Observable<Gist> {
    const headers = new HttpHeaders({
      Accept: 'application/vnd.github.v3+json',
    });

    return this.http
      .get<Gist>(`${this.apiUrl}/gists/${gistId}`, { headers })
      .pipe(retry(1), catchError(this.handleError));
  }

  // Add this new method
  forkGist(gistId: string): Observable<Gist> {
    return this.http
      .post<Gist>(`${this.apiUrl}/gists/${gistId}/forks`, {})
      .pipe(retry(1), catchError(this.handleError));
  }

  // Add this method to GistService
  verifyToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user`, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.github.v3+json',
      }),
    });
  }
  createGist(data: any): Observable<any> {
    return this.http.post('https://api.github.com/gists', data);
  }
  // Add this method to GistService
  testAuth(): Observable<any> {
    const token = 'token_here';
    console.log(
      'Testing auth with token:',
      token ? 'Token exists' : 'No token'
    );

    return this.http.get('https://api.github.com/user', {
      headers: new HttpHeaders({
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }),
    });
  }
}
