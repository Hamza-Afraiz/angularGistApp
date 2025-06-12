import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Gist } from './gist.service';

@Injectable({
  providedIn: 'root',
})
export class ForkService {
  private baseUrl = 'https://api.github.com';
  private forkedGistsSubject = new BehaviorSubject<Gist[]>([]);
  forkedGists$: Observable<Gist[]> = this.forkedGistsSubject.asObservable();

  constructor(private http: HttpClient, private message: NzMessageService) {}

  isForked(gistId: string): boolean {
    return this.forkedGistsSubject.value.some((gist) => gist.id === gistId);
  }

  forkGist(gistId: string): Observable<any> {
    return this.http
      .post<Gist>(`${this.baseUrl}/gists/${gistId}/forks`, {})
      .pipe(
        tap((forkedGist) => {
          const currentForked = this.forkedGistsSubject.value;
          if (!currentForked.some((g) => g.id === forkedGist.id)) {
            // Create a new array reference to trigger change detection
            this.forkedGistsSubject.next([...currentForked, forkedGist]);
            this.message.success('Gist forked successfully!');
          }
        }),
        catchError((error) => {
          console.error('Error forking gist:', error);
          this.message.error(
            'Failed to fork gist. Make sure you are logged in.'
          );
          return of(error);
        })
      );
  }
}
