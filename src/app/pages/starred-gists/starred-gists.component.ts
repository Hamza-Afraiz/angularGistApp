// src/app/pages/starred-gists/starred-gists.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GistGridComponent } from '../../components/gist-grid/gist-grid.component';
import { Gist, GistService } from '../../services/gist.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, mergeMap, tap } from 'rxjs/operators';
import { StarredGistService } from '../../services/starred-gist.service';
import { ForkService } from '../../services/fork.service';

@Component({
  selector: 'app-starred-gists',
  standalone: true,
  imports: [
    CommonModule,
    NzAvatarModule,
    NzButtonModule,
    NzGridModule,
    NzPaginationModule,
    NzSpinModule,
    GistGridComponent,
    NzCardModule,
  ],
  templateUrl: './starred-gists.component.html',
  styleUrl: './starred-gists.component.scss',
})
export class StarredGistsComponent implements OnInit, OnDestroy {
  gists: Gist[] = [];
  allGists: Gist[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalGists: number = 0;
  loading = false;

  constructor(
    private gistService: GistService,
    private http: HttpClient,
    private message: NzMessageService,
    private starredGistService: StarredGistService,
    private forkService: ForkService
  ) {}

  ngOnInit(): void {
    this.loadStarredGists();
  }

  loadStarredGists(): void {
    this.loading = true;
    this.starredGistService
      .loadStarredGists()
      .pipe(
        catchError((error) => {
          console.error('Load starred gists error:', error);
          return of([]);
        }),
        mergeMap((gists) => {
          if (gists.length === 0) {
            return of([]);
          }
          const contentRequests = gists.map((gist) => {
            const firstFile = Object.values(gist.files || {})[0];
            if (firstFile) {
              // Use the gist API endpoint instead of raw URL
              return this.http
                .get<Gist>(`https://api.github.com/gists/${gist.id}`, {
                  headers: new HttpHeaders({
                    Accept: 'application/vnd.github.v3+json',
                  }),
                })
                .pipe(
                  tap((gistDetail) => {
                    if (firstFile && gistDetail.files) {
                      const fileContent = Object.values(gistDetail.files)[0];
                      if (fileContent) {
                        firstFile.content = fileContent.content;
                      }
                    }
                  }),
                  catchError((contentError) => {
                    console.error(
                      'Error fetching gist content:',
                      contentError,
                      'Gist ID:',
                      gist.id,
                      'Status:',
                      contentError.status
                    );
                    return of(null);
                  })
                ) as Observable<Gist | null>;
            } else {
              return of(null) as Observable<Gist | null>;
            }
          });
          return forkJoin(contentRequests).pipe(map(() => gists));
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (gistsWithContent) => {
          console.log('Starred gists with content:', gistsWithContent);
          this.allGists = gistsWithContent;
          this.applyPagination();
        },
        error: (err) => {
          console.error('Error loading starred gists:', err);
        },
      });
  }

  private applyPagination(): void {
    this.totalGists = this.allGists.length;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.gists = this.allGists.slice(startIndex, endIndex);
  }

  onPageIndexChange(index: number): void {
    this.currentPage = index;
    this.loadStarredGists();
  }

  onStar(gist: Gist): void {
    if (this.starredGistService.isStarred(gist.id)) {
      this.starredGistService.unstarGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist unstarred successfully!');
          this.loadStarredGists(); // Reload the list after unstarring
        },
        error: (error) => {
          console.error('Error unstarring gist:', error);
          this.message.error(
            'Failed to unstar gist. Make sure you are logged in.'
          );
        },
      });
    }
  }

  onFork(gist: Gist): void {
    if (!this.forkService.isForked(gist.id)) {
      this.forkService.forkGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist forked successfully!');
        },
        error: (error) => {
          console.error('Error forking gist:', error);
          this.message.error(
            'Failed to fork gist. Make sure you are logged in.'
          );
        },
      });
    }
  }

  isStarred(gistId: string): boolean {
    return this.starredGistService.isStarred(gistId);
  }

  isForked(gistId: string): boolean {
    return this.forkService.isForked(gistId);
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }
}
