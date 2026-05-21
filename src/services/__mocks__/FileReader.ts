class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readyState = MockFileReader.EMPTY;
  result: string | null = null;
  onload: ((event: { target: { result: string } }) => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  readAsText(file: File) {
    this.readyState = MockFileReader.LOADING;
    file.text().then(
      text => {
        this.result = text;
        this.readyState = MockFileReader.DONE;
        if (this.onload) {
          this.onload({ target: { result: text } });
        }
      },
      error => {
        this.readyState = MockFileReader.DONE;
        if (this.onerror) {
          this.onerror(error);
        }
      }
    );
  }
}

global.FileReader = MockFileReader as typeof FileReader;
