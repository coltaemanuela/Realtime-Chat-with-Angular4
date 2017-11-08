import { ThumbsplitWebPage } from './app.po';

describe('thumbsplit-web App', function() {
  let page: ThumbsplitWebPage;

  beforeEach(() => {
    page = new ThumbsplitWebPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
