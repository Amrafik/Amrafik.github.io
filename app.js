(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';
  const caseDialog = document.getElementById('case-dialog');
  const commandDialog = document.getElementById('command-dialog');
  const caseContent = document.getElementById('case-content');
  const dialogOpeners = new WeakMap();
  let priorBodyOverflow = null;

  const cases = {
    telecom: {
      title: 'Telecom Customer Intelligence Assistant',
      lead: 'I brought retrieval, customer lookup, and churn prediction into one assistant, with a deliberate path from question to tool to answer.',
      sections: [
        ['My role', 'I developed this independent AI and machine learning project across the agent workflow, predictive model, API, interface, and evaluation.'],
        ['What I built', 'I built two specialized LangGraph agent branches with FAISS-based RAG retrieval and parameterized SQLite customer lookups. In local live mode, I integrated Gemini routing and tool calling. I added validated tool inputs, FastAPI REST endpoints, a Streamlit interface, and structured request logging.'],
        ['How I checked it', 'I trained and tuned a Scikit-learn Random Forest using GridSearchCV and grouped cross-validation. On 635 held-out UCI Iranian Churn records, I achieved an F1 score of 0.856 and ROC-AUC of 0.979. I documented 143 passing automated tests and 30/30 offline evaluation cases, alongside limited live Gemini verification.'],
        ['My stack', 'Python · LangGraph · Gemini API · FAISS · SQLite · Scikit-learn · FastAPI · Streamlit · Pydantic · Pytest']
      ],
      note: 'My hosted demo runs offline. Gemini routing and live tool calling run in my local live mode. The model scores above describe the held-out dataset evaluation.',
      links: [
        ['Explore my source code', 'https://github.com/Amrafik/telecom-customer-intelligence-ai-assistant'],
        ['Open my offline demo', 'https://amrafik-telecom-ai.streamlit.app/']
      ]
    },
    hayah: {
      title: 'Hayah — Smart Assistive Wearable Glasses',
      lead: 'For my graduation project, I built an embedded AI wearable integrating emotion recognition, gesture detection, and visual scene analysis.',
      sections: [
        ['My role', 'I worked on the embedded AI system and prepared annotated image and video datasets for the wearable.'],
        ['What I built', 'I integrated real-time facial emotion recognition, gesture detection, and visual scene analysis into smart assistive glasses. My data work included curating and annotating images and videos for edge inference.'],
        ['How I checked it', 'I prepared data covering varied lighting and movement conditions. I completed Hayah as my graduation project and received an A+ grade.'],
        ['My focus', 'Embedded AI · Computer vision · Image and video annotation · Dataset curation · Edge inference']
      ],
      note: 'I use a concept illustration on this portfolio to explain the three vision capabilities.',
      links: []
    },
    banking: {
      title: 'Banking Analytics System',
      lead: 'During my 2025 data integration internship at EJADA Systems, I collaborated with two teammates on a banking analytics project.',
      sections: [
        ['My role', 'I contributed to the relational data work and Informatica ETL mappings as part of a three-person team.'],
        ['What I built', 'I worked with a 13-table schema covering accounts, transactions, loans, investments, and other banking data. I connected the relational structure with analytical Oracle SQL and Informatica PowerCenter mappings.'],
        ['How I checked it', 'I worked through the banking data with JOINs, aggregations, CTEs, and ranking functions, alongside the transformation logic in Informatica ETL mappings.'],
        ['My stack', 'Oracle SQL · Informatica PowerCenter · Relational schemas · Analytical SQL · ETL']
      ],
      note: 'I completed this collaborative project during my July–August 2025 internship in Cairo.',
      links: []
    },
    analytics: {
      title: 'Sales Intelligence & Reporting',
      lead: 'At EJADA Systems in 2024, I worked on an end-to-end AdventureWorks business intelligence project.',
      sections: [
        ['My role', 'I worked across data preparation, warehouse-based integration, and Power BI reporting during my data analysis internship.'],
        ['What I built', 'I integrated customer, product, and sales data using SSMS and SSIS, then developed Power BI reports and visualizations to support sales analysis.'],
        ['How I checked it', 'I imported, cleaned, and transformed the data as part of the warehouse-based analysis workflow. My reporting work brought the customer, product, and sales dimensions together for analysis.'],
        ['My stack', 'SSMS · SSIS · Power BI · ETL · Data warehousing · Sales analysis']
      ],
      note: 'I use a schematic chart here to introduce the project; it does not reproduce the original Power BI reports or business results.',
      links: []
    }
  };

  function syncDialogLock() {
    const anyOpen = Boolean(caseDialog?.open || commandDialog?.open);
    if (anyOpen) {
      if (priorBodyOverflow === null) priorBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (priorBodyOverflow !== null) {
      document.body.style.overflow = priorBodyOverflow;
      priorBodyOverflow = null;
    }
  }

  function openDialog(dialog, opener) {
    if (!dialog || dialog.open) return;
    [caseDialog, commandDialog].forEach(other => {
      if (other && other !== dialog && other.open) other.close();
    });
    dialogOpeners.set(dialog, opener || document.activeElement);
    dialog.showModal();
    dialog.scrollTop = 0;
    syncDialogLock();
  }

  [caseDialog, commandDialog].forEach(dialog => {
    if (!dialog) return;
    dialog.addEventListener('close', () => {
      syncDialogLock();
      if (!caseDialog?.open && !commandDialog?.open) {
        const opener = dialogOpeners.get(dialog);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  document.getElementById('close-dialog')?.addEventListener('click', () => caseDialog?.close());
  document.getElementById('close-menu')?.addEventListener('click', () => commandDialog?.close());

  function createNode(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function openCase(key, opener) {
    const project = cases[key];
    if (!project || !caseContent || !caseDialog) return;
    caseContent.replaceChildren();
    const title = createNode('h2', '', project.title);
    title.id = 'case-title';
    caseContent.append(title, createNode('p', 'case-lead', project.lead));

    const navigation = createNode('nav', 'case-navigation');
    navigation.setAttribute('aria-label', 'Case study sections');
    project.sections.forEach(([heading], index) => {
      const link = createNode('a', '', heading);
      link.href = `#case-${key}-${index}`;
      link.addEventListener('click', event => {
        event.preventDefault();
        document.getElementById(`case-${key}-${index}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      });
      navigation.append(link);
    });
    caseContent.append(navigation);

    project.sections.forEach(([heading, text], index) => {
      const section = createNode('section', 'case-section');
      section.id = `case-${key}-${index}`;
      section.append(createNode('h3', '', heading), createNode('p', '', text));
      caseContent.append(section);
    });
    caseContent.append(createNode('p', 'case-note', project.note));

    if (project.links.length) {
      const links = createNode('div', 'case-links');
      project.links.forEach(([label, url]) => {
        const link = createNode('a', '', `${label} ↗`);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        links.append(link);
      });
      caseContent.append(links);
    }
    openDialog(caseDialog, opener);
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project]');
    if (trigger && cases[trigger.dataset.project]) {
      event.preventDefault();
      openCase(trigger.dataset.project, trigger);
    }
  });

  ['open-menu', 'footer-menu'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', event => {
      event.preventDefault();
      openDialog(commandDialog, event.currentTarget);
    });
  });
  commandDialog?.addEventListener('click', event => {
    if (event.target.closest('a[href]')) commandDialog.close();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (commandDialog?.open) commandDialog.close();
      else openDialog(commandDialog, document.activeElement);
    }
  });

  const inspectContent = {
    routing: ['I give each question a path.', 'I use two specialized LangGraph agent branches. Gemini routing and tool calling run in my local live mode; my hosted demo runs offline.'],
    retrieval: ['I bring relevant context into the answer.', 'I use FAISS-based retrieval and embeddings in a RAG workflow to connect the assistant with reference material.'],
    customer: ['I keep customer lookups structured.', 'I use parameterized SQLite queries and validated tool inputs to retrieve customer information through structured calls.'],
    prediction: ['I check the model against held-out data.', 'I tuned a Random Forest with GridSearchCV and grouped cross-validation: F1 0.856 and ROC-AUC 0.979 on 635 held-out UCI Iranian Churn records.']
  };
  const inspectButtons = [...document.querySelectorAll('button[data-inspect]')];
  inspectButtons.forEach(button => button.addEventListener('click', () => {
    const content = inspectContent[button.dataset.inspect];
    if (!content) return;
    inspectButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    const title = document.getElementById('inspect-title');
    const copy = document.getElementById('inspect-copy');
    if (title) title.textContent = content[0];
    if (copy) copy.textContent = content[1];
  }));

  const visionContent = {
    emotion: 'I integrated real-time facial emotion recognition into my wearable, and prepared annotated image and video data across varied lighting and movement conditions.',
    gesture: 'I integrated gesture detection into the embedded AI wearable and prepared annotated image and video datasets to support edge inference.',
    scene: 'I brought visual scene analysis into Hayah alongside emotion recognition and gesture detection, connecting three computer vision capabilities in one wearable.'
  };
  const visionButtons = [...document.querySelectorAll('button[data-vision]')];
  visionButtons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.vision;
    if (!visionContent[key]) return;
    visionButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    const description = document.getElementById('vision-description');
    if (description) description.textContent = visionContent[key];
    document.querySelectorAll('.hayah-visual').forEach(visual => {
      visual.dataset.mode = key;
      visual.dataset.vision = key;
    });
  }));

  const approachContent = {
    build: ['I connect the pieces into a working system: agent workflows, retrieval, structured tools, APIs, and a usable interface. My telecom assistant brings that work together.', 'Explore my AI assistant ↗'],
    evaluate: ['I evaluate AI-generated code for correctness, reasoning, edge cases, and instruction adherence. I also bring experience in function calling, voice evaluation, VQA, and annotation.', 'Explore my evaluation work ↗'],
    prove: ['I make the evidence visible. For my telecom assistant, I documented 143 passing automated tests, 30/30 offline evaluation cases, and model results on 635 held-out records.', 'See my project evidence ↗']
  };
  const approachButton = document.getElementById('approach-project');
  const approachButtons = [...document.querySelectorAll('button[data-approach]')];
  approachButtons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.approach;
    const content = approachContent[key];
    if (!content) return;
    approachButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    const detail = document.getElementById('approach-detail');
    if (detail) detail.textContent = content[0];
    if (approachButton) {
      approachButton.textContent = content[1];
      if (key === 'evaluate') {
        delete approachButton.dataset.project;
        approachButton.dataset.scroll = 'experience';
      } else {
        approachButton.dataset.project = 'telecom';
        delete approachButton.dataset.scroll;
      }
    }
  }));
  approachButton?.addEventListener('click', () => {
    if (approachButton.dataset.scroll === 'experience') {
      document.getElementById('experience')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }
  });

  document.querySelectorAll('[role="tablist"]').forEach(tablist => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const selectTab = tab => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
          (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(tabs[nextIndex]);
        tabs[nextIndex].focus();
      });
    });
  });

  let copyTimeout;
  document.getElementById('copy-email')?.addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    if (!status) return;
    clearTimeout(copyTimeout);
    try {
      await navigator.clipboard.writeText('amrorafik712@gmail.com');
      status.textContent = 'Copied to clipboard.';
    } catch {
      status.textContent = 'My email: amrorafik712@gmail.com';
    }
    copyTimeout = setTimeout(() => { status.textContent = ''; }, 5000);
  });

  const progress = document.querySelector('.reading-progress');
  let progressFrame = 0;
  function updateProgress() {
    progressFrame = 0;
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const amount = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
    progress.style.width = `${amount}%`;
  }
  function scheduleProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress);
  updateProgress();

  const revealElements = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    try {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px 35px 0px' });
      revealElements.forEach(element => revealObserver.observe(element));
      document.documentElement.classList.add('js-ready');
    } catch {
      revealElements.forEach(element => element.classList.add('is-visible'));
      document.documentElement.classList.remove('js-ready');
    }
  } else {
    revealElements.forEach(element => element.classList.add('is-visible'));
  }
  const handleReducedMotion = event => {
    if (event.matches) revealElements.forEach(element => element.classList.add('is-visible'));
  };
  reducedMotion.addEventListener?.('change', handleReducedMotion);

  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
    const navigationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    links.forEach(link => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) navigationObserver.observe(section);
    });
  }

  const finePointer = window.matchMedia('(pointer: fine)');
  document.querySelectorAll('.spotlight').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
      const bounds = element.getBoundingClientRect();
      element.style.setProperty('--mouse-x', `${event.clientX - bounds.left}px`);
      element.style.setProperty('--mouse-y', `${event.clientY - bounds.top}px`);
    }, { passive: true });
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--mouse-x');
      element.style.removeProperty('--mouse-y');
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
