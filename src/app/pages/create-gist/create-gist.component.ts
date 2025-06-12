import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GistService } from '../../services/gist.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-gist',
  templateUrl: './create-gist.component.html',
  styleUrls: ['./create-gist.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CreateGistComponent {
  gistForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private gistService: GistService,
    private message: NzMessageService
  ) {
    this.gistForm = this.fb.group({
      description: [''],
      public: [true],
      files: this.fb.array([this.createFileGroup()]),
    });
  }

  get files(): FormArray {
    return this.gistForm.get('files') as FormArray;
  }

  createFileGroup(): FormGroup {
    return this.fb.group({
      filename: ['', [Validators.required]],
      content: ['', [Validators.required]],
    });
  }

  addFile(): void {
    this.files.push(this.createFileGroup());
  }

  removeFile(index: number): void {
    if (this.files.length > 1) {
      this.files.removeAt(index);
    }
  }

  hasDuplicateFilenames(): boolean {
    const filenames = this.files.controls.map((fg) =>
      fg.get('filename')?.value.trim()
    );
    return new Set(filenames).size !== filenames.length;
  }

  submit(): void {
    if (this.gistForm.invalid || this.hasDuplicateFilenames()) {
      this.message.error('Please fix errors before submitting.');
      return;
    }
    this.loading = true;
    const { description, public: isPublic, files } = this.gistForm.value;
    const filesObj: any = {};
    files.forEach((file: any) => {
      filesObj[file.filename.trim()] = { content: file.content };
    });

    this.gistService
      .createGist({
        description,
        public: isPublic,
        files: filesObj,
      })
      .subscribe({
        next: (res) => {
          this.message.success('Gist created successfully!');
          this.gistForm.reset({ description: '', public: true, files: [] });
          this.files.clear();
          this.addFile();
          this.loading = false;
        },
        error: (err) => {
          this.message.error('Failed to create gist.');
          this.loading = false;
        },
      });
  }
}
