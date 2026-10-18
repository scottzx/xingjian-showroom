// i18n type definitions
export interface TranslationResources {
  toolbar: {
    new: string;
    open: string;
    save: string;
    exportPng: string;
    preview3d: string;
    undo: string;
    redo: string;
    newProject: string;
    openProject: string;
    saveProject: string;
    information: string;
    installWrap: string;
    buyCoffee: string;
    helpSupport: string;
    projectInfo: string;
    modelNotAvailable: string;
  };
  tools: {
    move: string;
    brush: string;
    text: string;
    fill: string;
    rectangle: string;
    circle: string;
    line: string;
    star: string;
    image: string;
    texture: string;
    aiTextures: string;
    aiTooltip: string;
    aiTooltipDesc: string;
    tryIt: string;
  };
  dialogs: {
    newProject: {
      title: string;
      subtitle: string;
      projectName: string;
      projectNamePlaceholder: string;
      teslaModel: string;
      baseColor: string;
      customColor: string;
      cancel: string;
      create: string;
    };
    unsavedChanges: {
      title: string;
      message: string;
      save: string;
      discard: string;
      cancel: string;
    };
    download: {
      title: string;
      message: string;
      filename: string;
      cancel: string;
      download: string;
    };
    save: {
      title: string;
      description: string;
      placeholder: string;
      cancel: string;
      save: string;
      saving: string;
    };
    login: {
      title: string;
      subtitle: string;
      signIn: string;
      signUp: string;
      email: string;
      emailAddress: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      username: string;
      usernamePlaceholder: string;
      orContinue: string;
      google: string;
      noAccount: string;
      hasAccount: string;
      noAccountSignUp: string;
      hasAccountSignIn: string;
      close: string;
      loading: string;
      checkingUsername: string;
      checkingEmail: string;
      creatingAccount: string;
      checking: string;
      errors: {
        usernameRequired: string;
        usernameTooShort: string;
        passwordTooShort: string;
        passwordsNotMatch: string;
        usernameTaken: string;
        emailRegistered: string;
        emailInUse: string;
        authFailed: string;
        emailNotConfirmed: string;
        supabaseNotConfigured: string;
        sessionNotReady: string;
        checkConfirmationFailed: string;
      };
      signupSuccess: {
        title: string;
        sentConfirmationTo: string;
        checkYourEmail: string;
        checkEmailDesc: string;
        checkSpamFolder: string;
        continue: string;
        checkingConfirmation: string;
      };
      joinCommunity: string;
    };
    info: {
      title: string;
      howToUseTitle: string;
      useStep1: string;
      useStep2: string;
      useStep3: string;
      usbSetupTitle: string;
      usbStep1: string;
      usbStep2: string;
      usbStep3: string;
      usbStep4: string;
      usbNote: string;
      troubleshootingTitle: string;
      troubleshootingDesc: string;
      troubleshootingTip1: string;
      troubleshootingTip2: string;
      gotIt: string;
      close: string;
    };
    aiGenerator: {
      title: string;
      subtitle: string;
      prompt: string;
      promptPlaceholder: string;
      style: string;
      styles: {
        abstract: string;
        geometric: string;
        organic: string;
        tribal: string;
        carbon: string;
        gradients: string;
      };
      generate: string;
      generating: string;
      insert: string;
      cancel: string;
      noCredits: string;
      getMore: string;
    };
    openProject: {
      title: string;
      myProjects: string;
      recent: string;
      noProjects: string;
      noProjectsDesc: string;
      openFile: string;
      cancel: string;
      delete: string;
      deleteConfirm: string;
    };
  };
  properties: {
    title: string;
    noLayerSelected: string;
    selectLayer: string;
    fill: string;
    fillSettings: string;
    fillColor: string;
    brush: string;
    brushSettings: string;
    size: string;
    color: string;
    hardness: string;
    opacity: string;
    flow: string;
    spacing: string;
    smoothing: string;
    blendMode: string;
    blendModes: {
      normal: string;
      multiply: string;
      screen: string;
      overlay: string;
    };
    transform: string;
    xPosition: string;
    yPosition: string;
    scaleX: string;
    scaleY: string;
    rotation: string;
    text: string;
    content: string;
    fontFamily: string;
    fontSize: string;
    textColor: string;
    horizontal: string;
    vertical: string;
    style: string;
    decoration: string;
    decorationOptions: {
      none: string;
      underline: string;
      strikethrough: string;
    };
    rectangle: string;
    width: string;
    height: string;
    stroke: string;
    strokeWidth: string;
    cornerRadius: string;
    circle: string;
    radius: string;
    image: string;
    file: string;
    dimensions: string;
    useTemplateMask: string;
    useTemplateMaskDesc: string;
    maskHint: string;
    line: string;
    strokeColor: string;
    lineCap: string;
    lineJoin: string;
    lineCaps: {
      butt: string;
      round: string;
      square: string;
    };
    lineJoins: {
      miter: string;
      round: string;
      bevel: string;
    };
    arrows: string;
    arrowStart: string;
    arrowEnd: string;
    star: string;
    points: string;
    innerRadius: string;
    outerRadius: string;
    brushLayer: string;
    strokes: string;
    clearAll: string;
  };
  layers: {
    title: string;
    template: string;
    baseColor: string;
    edit: string;
    addLayer: string;
    duplicate: string;
    delete: string;
    bringForward: string;
    sendBackward: string;
    bringToFront: string;
    sendToBack: string;
    lock: string;
    unlock: string;
    hide: string;
    show: string;
    mergeDown: string;
    mirrorHorizontal: string;
    mirrorVertical: string;
    copy: string;
    paste: string;
  };
  common: {
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
  };
  colors: {
    pearlWhite: string;
    midnightSilver: string;
    deepBlue: string;
    solidBlack: string;
    redMultiCoat: string;
    quicksilver: string;
    midnightCherry: string;
  };
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationResources;
    };
  }
}
