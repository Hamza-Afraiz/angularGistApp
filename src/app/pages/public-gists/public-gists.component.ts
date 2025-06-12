// src/app/pages/public-gists/public-gists.component.ts
// src/app/pages/public-gists/public-gists.component.ts
// src/app/pages/public-gists/public-gists.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  StarOutline,
  StarFill,
  ForkOutline,
} from '@ant-design/icons-angular/icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  mergeMap,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators'; // Import debounceTime, distinctUntilChanged
import { GistGridComponent } from '../../components/gist-grid/gist-grid.component';
import { Gist, GistService } from '../../services/gist.service';
import { SearchService } from '../../shared/search.service';
import { RouterModule } from '@angular/router';
import { StarredGistService } from '../../services/starred-gist.service';
import { ForkService } from '../../services/fork.service';

@Component({
  selector: 'app-public-gists',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzTagModule,
    NzAvatarModule,
    NzIconModule,
    NzSpinModule,
    GistGridComponent,
    NzPaginationModule,
    RouterModule,
  ],
  templateUrl: './public-gists.component.html',
  styleUrls: ['./public-gists.component.scss'],
})
export class PublicGistsComponent implements OnInit, OnDestroy {
  icons = {
    StarOutline: 'star-outline',
    StarFill: 'star-fill',
    ForkOutline: 'fork-outline',
  };

  gists: Gist[] = []; // Gists for the current page (displayed)
  allGists: Gist[] = []; // Store all fetched public gists for local search
  loading = false;
  total = 1000;
  pageSize = 10;
  pageIndex = 1;
  viewMode = 'table';
  private currentSearchTerm = '';
  private searchSubscription!: Subscription;
  private forkSubscription!: Subscription;
  private starredSubscription!: Subscription;
  private userGistIds = new Set<string>(); // Add this to store user's gist IDs
  private currentUser: string | null = null;
  constructor(
    private gistService: GistService,
    private message: NzMessageService,
    private http: HttpClient,
    private searchService: SearchService,
    private starredGistService: StarredGistService,
    private forkService: ForkService
  ) {}

  ngOnInit() {
    // Add this to your existing ngOnInit
    this.gistService.verifyToken().subscribe({
      next: (user) => {
        console.log('Token is valid, authenticated as:', user.login);
        this.currentUser = user.login;
      },
      error: (error) => {
        console.error('Token verification failed:', error);
        this.message.error('Authentication failed. Please log in again.');
      },
    });
    this.forkSubscription = this.forkService.forkedGists$.subscribe(() => {
      // Force change detection by creating a new array reference
      this.gists = [...this.gists];
    });

    this.starredSubscription = this.starredGistService.starredGists$.subscribe(
      () => {
        // Force UI update when starred status changes
        this.gists = [...this.gists];
      }
    );
    // Initial load of the first page of public gists
    this.loadPublicGists(this.pageIndex, this.pageSize);
    this.loadStarredGists();
    this.loadUserGists();

    // Subscribe to search term changes with debounce
    this.searchSubscription = this.searchService.searchTerm$
      .pipe(
        debounceTime(300), // Wait for 300ms after the last emit
        distinctUntilChanged() // Only proceed if the search term has actually changed
      )
      .subscribe((term) => {
        this.currentSearchTerm = term;
        this.pageIndex = 1; // Reset to the first page on a new search
        this.applySearchAndPagination(); // Apply filtering and pagination locally
      });
  }
  private loadUserGists(): void {
    this.gistService.getUserGists(1, 100).subscribe({
      next: (userGists) => {
        // Store user's gist IDs in Set for efficient lookup
        this.userGistIds = new Set(userGists.map((gist) => gist.id));
        console.log('Loaded user gists:', this.userGistIds);
        // Force UI update to reflect changes
        this.gists = [...this.gists];
      },
      error: (error) => {
        console.error('Error loading user gists:', error);
      },
    });
  }

  // Add method to check if a gist belongs to the current user
  isUserGist(gistId: string): boolean {
    return this.userGistIds.has(gistId);
  }
  private loadStarredGists(): void {
    this.starredGistService.loadStarredGists().subscribe({
      next: (starredGists) => {
        console.log('Loaded starred gists:', starredGists);
        // Force UI update to reflect starred status
        this.gists = [...this.gists];
      },
      error: (error) => {
        console.error('Error loading starred gists:', error);
      },
    });
  }
  // Method to load public gists (used initially and when search term is cleared)
  loadPublicGists(page: number, perPage: number): void {
    this.loading = true;
    this.gistService
      .getPublicGists(page, perPage)
      .pipe(
        catchError((error) => {
          console.error('Load public gists error:', error);
          this.message.error('Failed to load public gists.');
          return of([]);
        }),
        // Fetch file content for initial load
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
      .subscribe((gistsWithContent) => {
        this.allGists = gistsWithContent; // Store the fetched gists
        this.applySearchAndPagination(); // Apply search and pagination after initial load
      });
  }

  // Method to filter gists based on search term
  private filterGists(term: string): Gist[] {
    if (!term) {
      return this.allGists; // Return all gists if search term is empty
    }
    const lowerTerm = term.toLowerCase();
    return this.allGists.filter(
      (gist) =>
        gist.description?.toLowerCase().includes(lowerTerm) ||
        gist.owner?.login?.toLowerCase().includes(lowerTerm) ||
        Object.values(gist.files || {}).some(
          (file) =>
            file.filename.toLowerCase().includes(lowerTerm) ||
            file.content?.toLowerCase().includes(lowerTerm) // Search within fetched content
        )
    );
  }

  // Method to apply search filtering and pagination slicing
  private applySearchAndPagination(): void {
    const filteredGists = this.filterGists(this.currentSearchTerm);
    this.total = filteredGists.length; // Update total with the filtered count

    // Calculate the start and end index for the current page
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    // Slice the filtered gists for the current page display
    this.gists = filteredGists;
    console.log('Displayed gists:', this.gists, startIndex, endIndex);
    console.log('Total filtered count:', this.total);
  }

  onPageIndexChange(pageIndex: number) {
    this.pageIndex = pageIndex;
    // this.applySearchAndPagination();
    this.loadPublicGists(pageIndex, 10); // Apply pagination slicing when page changes
  }

  onStar(gist: Gist): void {
    if (this.starredGistService.isStarred(gist.id)) {
      this.starredGistService.unstarGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist unstarred successfully!');
        },
        error: (error) => {
          console.error('Error unstarring gist:', error);
          this.message.error(
            'Failed to unstar gist. Make sure you are logged in.'
          );
        },
      });
    } else {
      this.starredGistService.starGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist starred successfully!');
        },
        error: (error) => {
          console.error('Error starring gist:', error);
          this.message.error(
            'Failed to star gist. Make sure you are logged in.'
          );
        },
      });
    }
  }

  isStarred(gistId: string): boolean {
    return this.starredGistService.isStarred(gistId);
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

  isForked(gistId: string): boolean {
    console.log('isFokrd', gistId, this.isUserGist(gistId));
    // Don't show as forked if it's user's own gist
    if (this.isUserGist(gistId)) {
      return true;
    }

    return this.forkService.isForked(gistId);
  }

  testAuth() {
    this.gistService.testAuth().subscribe({
      next: (response) => {
        console.log('Auth test successful:', response);
        this.message.success('Authentication successful!');
      },
      error: (error) => {
        console.error('Auth test failed:', error);
        this.message.error('Authentication failed. Please check your token.');
      },
    });
  }
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.forkSubscription) {
      this.forkSubscription.unsubscribe();
    }
    if (this.starredSubscription) {
      this.starredSubscription.unsubscribe();
    }
  }
}
