_MODULES.push({
    description: `
      <ul>
        <li>Adds an element (<i class="fa fa-area-chart"></i> [Chance]%) below a giveaway's start time (in any page) that shows your chance of winning the giveaway.</li>
        <li>The chance is calculated by rounding up (using 2 decimals) the result of the following formula: number_of_copies / number_of_entries * 100
        <li>You can move the element around by dragging and dropping it.</li>
      </ul>
    `,
    features: {
      gwc_e: {
        description: `
          <ul>
            <li>The formula changes to: number_of_copies / (number_of_entries + 1) * 100
            <li>For example, if a giveaway has 5 entries, the current chance of winning it is 20%, but after you enter it, it will have 6 entries, so the chance will decrease to 16.67%.</li>
          </ul>
        `,
        name: `Show what the chance will be when you enter the giveaway instead of the current chance.`,
        sg: true
      },
      gwc_a: {
        description: `
          <ul>
            <li>Uses an advanced formula (number_of_copies / (number_of_entries / time_open_in_milliseconds * duration_in_milliseconds) * 100) to calculate the chance based on how much time the giveaway has been open and the duration of the giveaway. This gives you an estimate of what the chance will be when the giveaway ends.</li>
          </ul>
        `,
        features: {
          gwc_a_b: {
            name: `Show the basic chance along with the advanced one (the advanced chance will appear in a parenthesis, like "[Basic]% ([Advanced]%)").`,
            sg: true
          }
        },
        name: `Use advanced formula.`,
        sg: true
      },
      gwc_h: {
        conflicts: [
          {id: `gwr_h`, name: `Giveaway Winning Ratio > Highlight the giveaway.`}
        ],
        description: `
          <ul>
            <li>Changes the color of the giveaway's title to the same color as the chance and adds a border of same color to the giveaway's game image.</li>
          </ul>
        `,
        inputItems: [
          {
            id: `gwc_h_width`,
            prefix: `Image Border Width: `
          }
        ],
        name: `Highlight the giveaway.`,
        sg: true
      }
    },
    id: `gwc`,
    load: gwc,
    name: `Giveaway Winning Chance`,
    sg: true,
    type: `giveaways`
  });

  function gwc() {
    esgst.giveawayFeatures.push(gwc_addChances);
    if (esgst.gptw || !esgst.enteredPath) return;
    esgst.endlessFeatures.push(gwc_addHeading);
  }

  function gwc_addChances(giveaways, main, source) {
    giveaways.forEach(giveaway => {
      if (giveaway.sgTools || (main && (esgst.createdPath || esgst.wonPath || esgst.newGiveawayPath || esgst.archivePath))) return;
      if (((giveaway.inviteOnly && ((main && (esgst.giveawayPath || esgst.enteredPath)) || !main || giveaway.ended)) || !giveaway.inviteOnly) && !giveaway.innerWrap.getElementsByClassName(`esgst-gwc`)[0]) {
        if (giveaway.started) {
          giveaway.gwcContext = createElements(giveaway.panel, (esgst.gv && ((main && esgst.giveawaysPath) || (source === `gb` && esgst.gv_gb) || (source === `ged` && esgst.gv_ged) || (source === `ge` && esgst.gv_ge))) ? `afterBegin` : `beforeEnd`, [{
            attributes: {
              class: `${esgst.giveawayPath ? `featured__column` : ``} esgst-gwc`,
              [`data-columnId`]: `gwc`,
              title: getFeatureTooltip(`gwc`, `Giveaway Winning Chance`)
            },
            type: `div`
          }]);
          gwc_addChance(giveaway);
          if (!esgst.lockGiveawayColumns && (!main || esgst.giveawaysPath || esgst.userPath || esgst.groupPath)) {
            giveaway.gwcContext.setAttribute(`draggable`, true);
            giveaway.gwcContext.addEventListener(`dragstart`, giveaways_setSource.bind(null, giveaway));
            giveaway.gwcContext.addEventListener(`dragenter`, giveaways_getSource.bind(null, giveaway, false));
            giveaway.gwcContext.addEventListener(`dragend`, giveaways_saveSource.bind(null, giveaway));
          }
        } else {
          giveaway.chance = 100;
          giveaway.projectedChance = 100;
          giveaway.chancePerPoint = Math.round(giveaway.chance / Math.max(1, giveaway.points) * 100) / 100;
          giveaway.projectedChancePerPoint = giveaway.chancePerPoint;
        }
      }
    });
  }

  function gwc_addChance(giveaway) {
    let advancedChance = 0, advancedColor, basicChance, basicColor, colors, entries, i;
    entries = giveaway.entered || giveaway.ended || giveaway.created || !esgst.gwc_e ? giveaway.entries : giveaway.entries + 1;
    basicChance = entries > 0 ? Math.round(giveaway.copies / entries * 10000) / 100 : 100;
    basicChance = basicChance > 100 ? 100 : (basicChance <= 0 ? 0.01 : basicChance);
    if (esgst.gwc_a && !giveaway.ended && giveaway.startTime) {
      advancedChance = entries > 0 ? Math.round(giveaway.copies / (entries / (Date.now() - giveaway.startTime) * (giveaway.endTime - giveaway.startTime)) * 10000) / 100 : 100;
      advancedChance = advancedChance > 100 ? 100 : (advancedChance <= 0 ? 0.01 : advancedChance);
    }
    giveaway.chance = basicChance;
    giveaway.projectedChance = advancedChance;
    giveaway.chancePerPoint = Math.round(giveaway.chance / Math.max(1, giveaway.points) * 100) / 100;
    giveaway.projectedChancePerPoint = Math.round(giveaway.projectedChance / Math.max(1, giveaway.points) * 100) / 100;
    if (giveaway.points) {
      giveaway.gwcContext.title = getFeatureTooltip(`gwc`, `Giveaway Winning Chance (${giveaway.chancePerPoint}% basic and ${giveaway.projectedChancePerPoint}% advanced per point)`);
    }
    giveaway.gwcContext.setAttribute(`data-chance`, giveaway.chance);
    giveaway.gwcContext.setAttribute(`data-projectedChance`, giveaway.projectedChance);
    for (i = esgst.gwc_colors.length - 1; i > -1; --i) {
      colors = esgst.gwc_colors[i];
      if (basicChance >= parseFloat(colors.lower) && basicChance <= parseFloat(colors.upper)) {
        basicColor = colors.color;
        break;
      }
    }
    for (i = esgst.gwc_colors.length - 1; i > -1; --i) {
      colors = esgst.gwc_colors[i];
      if (advancedChance >= parseFloat(colors.lower) && advancedChance <= parseFloat(colors.upper)) {
        advancedColor = colors.color;
        break;
      }
    }
    if (esgst.gwc_h) {
      giveaway.headingName.classList.add(`esgst-gwc-highlight`);
      giveaway.headingName.style.color = esgst.gwc_a && !esgst.gwc_a_b ? advancedColor : basicColor;
      if (giveaway.image) {
        giveaway.image.classList.add(`esgst-gwc-highlight`);
        giveaway.image.style.color = `${esgst.gwc_a && !esgst.gwc_a_b ? advancedColor : basicColor}`;
        giveaway.image.style.boxShadow = `${esgst.gwc_a && !esgst.gwc_a_b ? advancedColor : basicColor} 0px 0px 0px var(--esgst-gwc-highlight-width, 3px) inset`;
      }
    }
    if (esgst.enteredPath) {
      giveaway.gwcContext.style.display = `inline-block`;
    }
    const items = [];
    if (!esgst.enteredPath) {
      items.push({
        attributes: {
          class: `fa fa-area-chart`
        },
        type: `i`
      });
    }
    const children = [];
    const basicAttributes = {};
    if (basicColor) {
      basicAttributes.style = `color: ${basicColor}; font-weight: bold;`
    }
    const advancedAttributes = {};
    if (advancedColor) {
      advancedAttributes.style = `color: ${advancedColor}; font-weight: bold;`
    }
    if (esgst.gwc_a && advancedChance) {
      if (esgst.gwc_a_b) {
        children.push({
          attributes: basicAttributes,
          text: `${basicChance}%`,
          type: `span`        
        }, {
          text: ` (`,
          type: `node`
        }, {
          attributes: advancedAttributes,
          text: `${advancedChance}%`,
          type: `span`        
        }, {
          text: `)`,
          type: `node`
        });
      } else {
        children.push({
          attributes: advancedAttributes,
          text: `${advancedChance}%`,
          type: `span`        
        });     
      }
    } else {
      children.push({
        attributes: basicAttributes,
        text: `${basicChance}%`,
        type: `span`        
      });
    }
    items.push({
      type: `span`,
      children
    });
    if (esgst.enteredPath && esgst.gwr) {
      items.push({
        text: ` / `,
        type: `node`
      });
    }
    createElements(giveaway.gwcContext, `inner`, items);
  }

  function gwc_addHeading(context, main, source, endless) {
    if (esgst.createdPath || esgst.wonPath || !main) return;
    const table = context.querySelector(`${endless ? `.esgst-es-page-${endless} .table__heading, .esgst-es-page-${endless}.table__heading` : `.table__heading`}`);
    if (!table || table.getElementsByClassName(`esgst-gwcr-heading`)[0]) return;
    let title = ``;
    if (esgst.gwc) {
      title += `Chance / `;
    }
    if (esgst.gwr) {
      title += `Ratio / `;
    }
    if (esgst.gptw) {
      title += `Points To Win / `;
    }
    title = title.slice(0, -3);
    createElements(table.firstElementChild, `afterEnd`, [{
      attributes: {
        class: `table__column--width-small text-center esgst-gwcr-heading`
      },
      text: title,
      type: `div`
    }]);
  }
  