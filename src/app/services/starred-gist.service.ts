// src/app/services/starred-gist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message'; // Assuming you are using NzMessageService for notifications
import { Gist } from './gist.service'; // Import Gist interface

@Injectable({
  providedIn: 'root',
})
export class StarredGistService {
  private baseUrl = 'https://api.github.com';
  // Using a BehaviorSubject to hold the list of starred gists
  // Initialize with an empty array
  private starredGistsSubject = new BehaviorSubject<Gist[]>([]);
  // Expose the list of starred gists as an observable
  starredGists$: Observable<Gist[]> = this.starredGistsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private message: NzMessageService // Inject NzMessageService
  ) {
    // Potentially load initial starred gists from API here if needed on service creation
    // This depends on whether you want to show starred gists immediately on app load
    // or only when the user navigates to the starred gists page.
    // For now, we'll assume loading happens when the user visits the starred page.
  }

  // Method to check if a gist is starred
  isStarred(gistId: string): boolean {
    return this.starredGistsSubject.value.some((gist) => gist.id === gistId);
  }

  // Method to star a gist
  starGist(gistId: string): Observable<any> {


    return this.http
      .put(`${this.baseUrl}/gists/${gistId}/star`, null, {
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        tap((response) => {
          console.log('Star response:', response);
          // On success (204 response), fetch the gist details and add to starred list
          this.getGistDetails(gistId).subscribe({
            next: (gist) => {
              const currentStarred = this.starredGistsSubject.value;
              if (!currentStarred.some((g) => g.id === gist.id)) {
                this.starredGistsSubject.next([...currentStarred, gist]);
                this.message.success('Gist starred successfully!');
              }
            },
            error: (error) => {
              console.error(
                'Failed to fetch gist details after starring:',
                error
              );
              this.message.error(
                'Gist starred, but failed to update local list.'
              );
            },
          });
        }),
        catchError((error) => {
          console.error('Error starring gist:', error);
          console.error('Error details:', {
            status: error.status,
            message: error.message,
            gistId: gistId,
            url: `${this.baseUrl}/gists/${gistId}/star`,
          });
          if (error.status === 404) {
            this.message.error(
              'Gist not found. Make sure the gist exists and you have access to it.'
            );
          } else if (error.status === 401) {
            this.message.error(
              'Authentication required. Please log in to star gists.'
            );
          } else {
            this.message.error('Failed to star gist.');
          }
          return of(error);
        })
      );
  }

  // Method to unstar a gist
  unstarGist(gistId: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/gists/${gistId}/star`, {
        observe: 'response',
        headers: new HttpHeaders({
          Accept: 'application/vnd.github.v3+json',
        }),
      })
      .pipe(
        tap(() => {
          const currentStarred = this.starredGistsSubject.value;
          const updatedStarred = currentStarred.filter(
            (gist) => gist.id !== gistId
          );
          this.starredGistsSubject.next(updatedStarred);
          this.message.success('Gist unstarred successfully!');
        }),
        catchError((error) => {
          console.error('Error unstarring gist:', error);
          if (error.status === 404) {
            this.message.error(
              'Gist not found. Make sure the gist exists and you have access to it.'
            );
          } else if (error.status === 401) {
            this.message.error(
              'Authentication required. Please log in to unstar gists.'
            );
          } else {
            this.message.error('Failed to unstar gist.');
          }
          return of(error);
        })
      );
  }

  // Method to fetch details of a single gist
  getGistDetails(gistId: string): Observable<Gist> {
    return this.http.get<Gist>(`${this.baseUrl}/gists/${gistId}`, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.github.v3+json',
      }),
    });
  }

  // Method to load the user's starred gists
  loadStarredGists(): Observable<Gist[]> {
    this.message.info('Loading starred gists...');
    return this.http
      .get<Gist[]>(`${this.baseUrl}/gists/starred`, {
        headers: new HttpHeaders({
          Accept: 'application/vnd.github.v3+json',
        }),
      })
      .pipe(
        tap((gists) => {
          this.starredGistsSubject.next(gists);
          this.message.success('Starred gists loaded.');
        }),
        catchError((error) => {
          console.error('Error loading starred gists:', error);
          if (error.status === 401) {
            this.message.error(
              'Authentication required. Please log in to view starred gists.'
            );
          } else {
            this.message.error('Failed to load starred gists.');
          }
          return of([]);
        })
      );
  }
}
