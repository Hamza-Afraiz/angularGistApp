import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Gist, GistService } from '../../services/gist.service';
import { CommonModule } from '@angular/common';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of,Subscription } from 'rxjs';
import { catchError, finalize, mergeMap, tap, map } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StarredGistService } from '../../services/starred-gist.service';
import { ForkService } from '../../services/fork.service';

@Component({
  selector: 'app-gist-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzSpinModule,
    NzIconModule,
  ],
  templateUrl: './gist-detail.component.html',
  styleUrl: './gist-detail.component.scss',
})
export class GistDetailComponent implements OnInit {
  gist: Gist | null = null;
  loading: boolean = true;
  private starredSubscription!: Subscription;
  private forkSubscription!: Subscription;
  private userGistIds = new Set<string>();
  private currentUser: string | null = null;
  icons = {
    ForkOutline: 'fork-outline',
    StarOutline: 'star-outline',
  };

  constructor(
    private route: ActivatedRoute,
    private gistService: GistService,
    private http: HttpClient,
    private message: NzMessageService,
    private starredGistService: StarredGistService,
    private forkService: ForkService
  ) {}

  ngOnInit(): void {
    this.starredGistService.loadStarredGists().subscribe({
      next: (starredGists) => {
        console.log('Loaded starred gists:', starredGists);
      },
      error: (error) => {
        console.error('Error loading starred gists:', error);
      }
    });

    // Get current user and load their gists
    this.gistService.verifyToken().subscribe({
      next: (user) => {
        this.currentUser = user.login;
        this.loadUserGists();
      },
      error: (error) => {
        console.error('Token verification failed:', error);
      }
    });

    // Subscribe to changes in starred gists
    this.starredSubscription = this.starredGistService.starredGists$.subscribe(() => {
      // Force UI update when starred status changes
      if (this.gist) {
        this.gist = { ...this.gist };
      }
    });

    // Subscribe to changes in forked gists
    this.forkSubscription = this.forkService.forkedGists$.subscribe(() => {
      // Force UI update when fork status changes
      if (this.gist) {
        this.gist = { ...this.gist };
      }
    });
    this.route.paramMap.subscribe((params) => {
      const gistId = params.get('id');
      if (gistId) {
        this.loadGistDetails(gistId);
      }
    });
  }
  private loadUserGists(): void {
    if (!this.currentUser) return;

    this.gistService.getUserGists(1, 100).subscribe({
      next: (userGists) => {
        this.userGistIds = new Set(userGists.map(gist => gist.id));
        console.log('Loaded user gists:', this.userGistIds);
        // Force UI update
        if (this.gist) {
          this.gist = { ...this.gist };
        }
      },
      error: (error) => {
        console.error('Error loading user gists:', error);
      }
    });
  }
  isUserGist(gistId: string): boolean {
    return this.userGistIds.has(gistId);
  }

  isStarred(gistId: string): boolean {
    return this.starredGistService.isStarred(gistId);
  }

  isForked(gistId: string): boolean {
    if (this.isUserGist(gistId)) {
      return false;
    }
    return this.forkService.isForked(gistId);
  }
  loadGistDetails(gistId: string): void {
    this.loading = true;
    this.gistService
      .getGistDetails(gistId)
      .pipe(
        catchError((error) => {
          console.error('Error loading gist details:', error);
          this.loading = false;
          return of(null);
        }),
        mergeMap((gistFromService: Gist | null) => {
          console.log(gistFromService);
          if (!gistFromService) {
            this.loading = false;
            return of(null);
          }

          // Set the gist immediately after receiving it
          this.gist = gistFromService;

          // If there are no files, return the gist immediately
          if (
            !gistFromService.files ||
            Object.keys(gistFromService.files).length === 0
          ) {
            return of(gistFromService);
          }

          const contentRequests = Object.values(gistFromService.files).map(
            (file) => {
              if (file && file.raw_url) {
                return this.http
                  .get(file.raw_url, { responseType: 'text' })
                  .pipe(
                    tap((content) => {
                      if (file) {
                        file.content = content;
                      }
                    }),
                    catchError((contentError) => {
                      console.error(
                        'Error fetching gist file content:',
                        contentError
                      );
                      return of(null);
                    })
                  );
              }
              return of(null);
            }
          );

          return forkJoin(contentRequests).pipe(map(() => gistFromService));
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (gistWithContent) => {
          if (gistWithContent) {
            this.gist = gistWithContent;
          } else {
            this.gist = null;
          }
        },
        error: (error) => {
          console.error('Error in subscription:', error);
          this.loading = false;
        },
      });
  }

  viewGitHubProfile(): void {
    if (this.gist?.owner?.login) {
      window.open(`https://github.com/${this.gist.owner.login}`, '_blank');
    }
  }
  onStar(gist: Gist): void {
    if (this.isStarred(gist.id)) {
      this.starredGistService.unstarGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist unstarred successfully!');
        },
        error: (error) => {
          console.error('Error unstarring gist:', error);
          this.message.error('Failed to unstar gist. Make sure you are logged in.');
        }
      });
    } else {
      this.starredGistService.starGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist starred successfully!');
        },
        error: (error) => {
          console.error('Error starring gist:', error);
          this.message.error('Failed to star gist. Make sure you are logged in.');
        }
      });
    }
  }

  onFork(gist: Gist): void {
    if (this.isUserGist(gist.id)) {
      this.message.warning('You cannot fork your own gist!');
      return;
    }

    if (!this.isForked(gist.id)) {
      this.forkService.forkGist(gist.id).subscribe({
        next: () => {
          this.message.success('Gist forked successfully!');
        },
        error: (error) => {
          console.error('Error forking gist:', error);
          this.message.error('Failed to fork gist. Make sure you are logged in.');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.starredSubscription) {
      this.starredSubscription.unsubscribe();
    }
    if (this.forkSubscription) {
      this.forkSubscription.unsubscribe();
    }
  }

  // Helper to get the language for syntax highlighting (optional, can be removed if not using a library)
  getLanguage(filename: string): string {
    const extension = filename.split('.').pop();
    if (!extension) return 'plaintext';
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cs':
        return 'csharp';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'vue':
        return 'vue';
      case 'xml':
        return 'xml';
      case 'sh':
        return 'shell';
      case 'bash':
        return 'shell';
      case 'sql':
        return 'sql';
      case 'yaml':
        return 'yaml';
      case 'yml':
        return 'yaml';
      case 'swift':
        return 'swift';
      case 'kt':
        return 'kotlin';
      case 'r':
        return 'r';
      case 'pl':
        return 'perl';
      case 'lua':
        return 'lua';
      case 'scss':
        return 'scss';
      case 'less':
        return 'less';
      // Add more cases as needed
      default:
        return 'plaintext';
    }
  }
}
