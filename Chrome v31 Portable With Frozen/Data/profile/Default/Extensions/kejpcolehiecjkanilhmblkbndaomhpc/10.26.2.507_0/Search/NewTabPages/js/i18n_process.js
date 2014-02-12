// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Invoke the template engine previously loaded from i18n_template.js

// KobyM - changed the templateData to loadTimeData
//i18nTemplate.process(document, templateData);
i18nTemplate.process(document, loadTimeData.data);
