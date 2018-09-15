import Module from '../../class/Module';

class GeneralPaginationNavigationOnTop extends Module {
info = ({
    description: `
      <ul>
        <li>Moves the pagination navigation of any page to the main page heading of the page.</li>
      </ul>
    `,
    id: `pnot`,
    load: this.pnot,
    name: `Pagination Navigation On Top`,
    sg: true,
    st: true,
    type: `general`
  });

  pnot() {
    if (!this.esgst.paginationNavigation || !this.esgst.mainPageHeading) return;

    if (this.esgst.st) {
      this.esgst.paginationNavigation.classList.add(`page_heading_btn`);
    }
    this.esgst.paginationNavigation.title = this.esgst.modules.common.getFeatureTooltip(`pnot`);
    this.esgst.mainPageHeading.appendChild(this.esgst.paginationNavigation);
  }
}

export default GeneralPaginationNavigationOnTop;