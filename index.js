document.addEventListener('DOMContentLoaded', () => {

  class ApplicationModel {
    constructor() {
      this.streamsResults = [];
      this.streamResultHandlers = [];
      this.query = null;
      this.offset = 0;
      this.limit = 6;
      this.twitchAPI = new TwitchAPI();
    }

    updateStreamResults(data) {
      data._offset = this.offset;
      data._limit = this.limit;
      this.streamsResults = data;
      this.streamResultHandlers.forEach(func => func(this.streamsResults));
    }

    pushStreamChangeHandler(handler) {
      this.streamResultHandlers.push(handler);
    }

    fetchQuery(query) {

       // if we are searching for a new stream
      if(this.query !== query) {
        this.offset = 0;
        this.query = query;
      }

      this.twitchAPI.searchStream(query, this.limit, this.offset)
        .then(data => {
          this.updateStreamResults(data);
        })
        .catch(err => {
          console.log('error', err)
        });
    }

    previousPage() {
      if(this.limit <= this.offset) {
        this.offset -= this.limit;
        this.twitchAPI.searchStream(this.query, this.limit, this.offset)
        .then(data => {
          this.updateStreamResults(data);
        })
        .catch(err => {
          console.log('error', err)
        });
      }
    }

    nextPage() {
      if(this.offset + this.limit <= this.streamsResults._total) {
        this.streamsResults._total;
        this.offset += this.limit;
        this.twitchAPI.searchStream(this.query, this.limit, this.offset)
        .then(data => {
          this.updateStreamResults(data);
        })
        .catch(err => {
          console.log('error', err)
        });
      }
    }

  }

  class ApplicationController {
    constructor(model) {
      this.model = model;
    }

    stageRequest(query) {
      this.model.fetchQuery(query);
    }

    previousPage() {
      this.model.previousPage();
    }

    nextPage() {
      this.model.nextPage();
    }

    subscribeToStreamChange(handler) {
      this.model.pushStreamChangeHandler(handler)
    }
  }



  class StreamBoardView {
    constructor(applicationController) {
      this.component = document.getElementById('searchResults');
      this.applicationController = applicationController
    }

    renderNavigator(data) {
      const wrapper = document.createElement('div');
      const results = document.createElement('p');
      const pointerWrapper = document.createElement('div');
      const leftPointer = document.createElement('div');
      const rightPointer = document.createElement('div');
      const pageTracker = document.createElement('p');

      leftPointer.addEventListener('click', () => {
        this.applicationController.previousPage();
      });

      rightPointer.addEventListener('click', () => {
        this.applicationController.nextPage();
      });


      wrapper.id = 'topHeader';
      wrapper.classList.add('clearfix');
      results.innerText = `Total Results: ${data._total}`;
      pageTracker.classList.add('pageTracker');
      
      // start index from 1
      let currentPage = Math.floor(data._offset / data._limit) + 1;
      let denominator = Math.floor(data._total / data._limit) + 1;

      pageTracker.innerText = `  ${currentPage} / ${denominator}  ` 
      leftPointer.classList.add('triangle-left');
      rightPointer.classList.add('triangle-right');

      wrapper.appendChild(results);
      wrapper.appendChild(pointerWrapper);
      pointerWrapper.appendChild(leftPointer);
      pointerWrapper.appendChild(pageTracker);
      pointerWrapper.appendChild(rightPointer);
      this.component.appendChild(wrapper);
    }

    renderEntity(data) {
      
      if(this.component.hasChildNodes()) {
        this.component.innerHTML = '';
      }
  
      if(data.streams.length > 0){
        this.renderNavigator(data)
        data.streams.forEach((stream) => {
          const card = document.createElement('div');
          const cardHeader = document.createElement('div');
          const img = document.createElement('img');
    
          const cardBlock = document.createElement('div');
          const cardBlockHeader = document.createElement('h4');
          const cardBlockParagraphOne = document.createElement('p');
          const cardBlockParagraphTwo = document.createElement('p');
  
          const { game, logo, status, display_name } = stream.channel;
    
          card.className = 'card flex-row flex-wrap';
          cardHeader.className = 'card-header border-0 entityImage';
          cardBlock.className = 'card-block card-width';
    
    
          cardBlockHeader.classList.add('card-title');
          cardBlockHeader.innerText = display_name;
  
          cardBlockParagraphOne.classList.add('card-text');
          cardBlockParagraphOne.innerText = game;
          cardBlockParagraphTwo.classList.add('card-text');
          cardBlockParagraphOne.innerText = status;
    
          img.src = logo;
          cardHeader.appendChild(img);
    
          cardBlock.appendChild(cardBlockHeader);
          cardBlock.appendChild(cardBlockParagraphOne);
          cardBlock.appendChild(cardBlockParagraphTwo);
          
          card.appendChild(cardHeader);
          card.appendChild(cardBlock);
          this.component.appendChild(card);
        });
      }
    }
  }

  class StreamBoardModel {
    constructor(applicationModel) {
      this.streamsResults = applicationModel.streamsResults;
    }
  }

  class StreamBoardController {
    constructor(streamBoardView, applicationController) {
      
      this.view = streamBoardView;
      this.applicationController = applicationController;

      this.rerenderStreamBoard = this.rerenderStreamBoard.bind(this);

      // subscribe to application state changes
      this.subscribeToStreamChange();
    }

    subscribeToStreamChange() {
      this.applicationController.subscribeToStreamChange(this.rerenderStreamBoard);
    }

    rerenderStreamBoard(data) {
      this.view.renderEntity(data)
    }

  }



  class SearchInputView {
    constructor(controller) {
      this.controller = controller;
      this.component = document.querySelector('#streamSearchInput');
      this.component.value = controller.getInputValue();
      this.component.addEventListener("keyup", controller.captureValue);

      this.buttonComponent = document.querySelector('.submissionBox button');
      this.buttonComponent.addEventListener('click', controller.submitInput)
    }

    updateInputViewText(value) {
      this.component.value = value;
    }
  }

  class SearchInputController {
    constructor(model, applicationController) {

      this.model = model;
      this.applicationController = applicationController;

      // always maintains the correct this context
      this.captureValue = this.captureValue.bind(this);
      this.submitInput = this.submitInput.bind(this);
    }

    addView(view) {
      this.view = view;
    }

    getInputValue() {
      return this.model.inputText;
    }

    captureValue(e) {
      if(e.keyCode === 13) {
        this.submitInput(e);
      } else {
        this.model.updateInputText(e.target.value);
        this.view.updateInputViewText(this.getInputValue());
      }
    }

    submitInput(e) {
      this.applicationController.stageRequest(this.getInputValue());
    }

  }

  class SearchInputModel {
    constructor() {
      this.inputText = 'fortnite';
    }

    updateInputText(value) {
      this.inputText = value;
    }
  }



  const instantiateApp = () => {

    const applicationModel = new ApplicationModel();
    const applicationController = new ApplicationController(applicationModel);

    // create model instance
    const twitchInputModel = new SearchInputModel();
    
    // create controller
    const twitchInputController = new SearchInputController(twitchInputModel, applicationController);
  
     // create view instance
     const twitchInputView = new SearchInputView(twitchInputController);
    
    // add view to the controller
    twitchInputController.addView(twitchInputView);

    const streamBoardView = new StreamBoardView(applicationController);
    const streamBoardController = new StreamBoardController(streamBoardView, applicationController);

    applicationModel.fetchQuery(twitchInputModel.inputText);
  };

  instantiateApp();
});

