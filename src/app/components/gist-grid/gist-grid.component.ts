import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Gist } from '../../services/gist.service';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type * as monaco from 'monaco-editor';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ForkOutline, StarOutline } from '@ant-design/icons-angular/icons';
import { StarredGistService } from '../../services/starred-gist.service';
import { ForkService } from '../../services/fork.service'; // Add this import
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gist-grid',
  templateUrl: './gist-grid.component.html',
  styleUrls: ['./gist-grid.component.scss'],
  standalone: true,
  imports: [
    MonacoEditorModule,
    CommonModule,
    FormsModule,
    NzPaginationModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
  ],
})
export class GistGridComponent {
  @Input() gists: Gist[] = [];

  @Output() star = new EventEmitter<Gist>();
  @Output() fork = new EventEmitter<Gist>();
  @Output() viewFile = new EventEmitter<{ gist: Gist; filename: string }>();

  icons = { StarOutline, ForkOutline };
  private forkSubscription!: Subscription;
  constructor(
    private starredGistService: StarredGistService,
    private forkService: ForkService // Add ForkService to constructor
  ) {}

  onEditorInit(editor: monaco.editor.IStandaloneCodeEditor) {
    setTimeout(() => editor.layout(), 0);
  }
  ngOnInit() {
    // Subscribe to forked gists changes
    this.forkSubscription = this.forkService.forkedGists$.subscribe(() => {
      // Force change detection by creating a new array reference
      this.gists = [...this.gists];
    });
  }
  getFirstFile(gist: Gist) {
    const files = Object.values(gist.files || {});
    console.log(files);
    return files.length ? files[0] : null;
  }

  onStar(gist: Gist, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.star.emit(gist);
  }

  onFork(gist: Gist, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fork.emit(gist);
    setTimeout(() => {
      console.log('Checking fork status after fork operation');
      this.gists = [...this.gists];
    }, 100);
  }

  isStarred(gistId: string): boolean {
    return this.starredGistService.isStarred(gistId);
  }

  // Add this method to check if a gist is forked
  isForked(gistId: string): boolean {
    return this.forkService.isForked(gistId);
  }
}
