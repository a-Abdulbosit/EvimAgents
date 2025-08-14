//let allShops = []
//let currentPage = 0
//const itemsPerPage = 6
//const expandedDescriptions = new Set()
//let selectedShopId = null
//let map = null // Initialize map as null
//const placemarks = []
//let isPanelOpen = false
//let lastDataHash = null
//let userLocationMarker = null
//let userLocation = null
//let watchId = null
//const ymaps = window.ymaps // Declare the ymaps variable
//let searchTerm = "" // New: Search term
//let filteredShops = [] // New: Filtered shops array
//let isSearchActive = false // New flag to indicate if search results are active

//// Auto-update interval (increased to 5 seconds for better performance)
//const AUTO_UPDATE_INTERVAL = 5000
//let updateInterval = null // Initialize updateInterval as null

//// DOM cache
//const domCache = {}

//// Initialize DOM cache
//function initDOMCache() {
//    const elements = [
//        "sidebarSubtitle",
//        "activeCount",
//        "pendingCount",
//        "inactiveCount",
//        "popupSubtitle",
//        "sidebarLoading",
//        "sidebarContent",
//        "shopsList",
//        "shopsGrid",
//        "paginationInfo",
//        "paginationControls",
//        "pagination",
//        "updateNotification",
//        "popupOverlay",
//        "sidebar",
//        "panelToggle",
//        "sidebarSearchInput", // New: Sidebar search input
//        "sidebarSearchResultsList", // New: Sidebar search results list
//    ]

//    elements.forEach((id) => {
//        domCache[id] = document.getElementById(id)
//        if (!domCache[id]) {
//            console.warn(`Element with id '${id}' not found`)
//        }
//    })
//}

//// Utility functions
//function debounce(func, wait) {
//    let timeout
//    return function executedFunction(...args) {
//        const later = () => {
//            clearTimeout(timeout)
//            func(...args)
//        }
//        clearTimeout(timeout)
//        timeout = setTimeout(later, wait)
//    }
//}

//function throttle(func, limit) {
//    let inThrottle
//    return function () {
//        const args = arguments
//        if (!inThrottle) {
//            func.apply(this, args)
//            inThrottle = true
//            setTimeout(() => (inThrottle = false), limit)
//        }
//    }
//}

//// Generate hash for data comparison
//function generateDataHash(data) {
//    const str = JSON.stringify(data)
//    let hash = 0
//    for (let i = 0; i < str.length; i++) {
//        const char = str.charCodeAt(i)
//        hash = (hash << 5) - hash + char
//        hash = hash & hash
//    }
//    return hash
//}

//// Notification functions
//function showUpdateNotification() {
//    if (domCache.updateNotification) {
//        domCache.updateNotification.classList.add("show")
//        setTimeout(() => {
//            domCache.updateNotification.classList.remove("show")
//        }, 2000)
//    }
//}

//function showLocationNotification(message, type = "info") {
//    const notification = document.createElement("div")
//    const colors = {
//        error: "#ef4444",
//        success: "#10b981",
//        info: "#3b82f6",
//    }

//    notification.style.cssText = `
//      position: fixed;
//      top: 80px;
//      right: 20px;
//      background: ${colors[type]};
//      color: white;
//      padding: 0.75rem 1rem;
//      border-radius: 0.5rem;
//      font-size: 0.875rem;
//      font-weight: 500;
//      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//      z-index: 1003;
//      transform: translateX(100%);
//      transition: transform 0.3s ease;
//      max-width: 300px;
//  `

//    notification.textContent = message
//    document.body.appendChild(notification)

//    setTimeout(() => {
//        notification.style.transform = "translateX(0)"
//    }, 100)

//    setTimeout(() => {
//        notification.style.transform = "translateX(100%)"
//        setTimeout(() => {
//            if (document.body.contains(notification)) {
//                document.body.removeChild(notification)
//            }
//        }, 300)
//    }, 4000)
//}

//function showErrorMessage(message) {
//    if (domCache.sidebarLoading) {
//        domCache.sidebarLoading.style.display = "none"
//    }

//    if (domCache.sidebarContent) {
//        domCache.sidebarContent.innerHTML = `
//        <div style="padding: 2rem; text-align: center; color: #ef4444;">
//            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
//            <div style="font-weight: 600; margin-bottom: 0.5rem;">Ошибка загрузки данных</div>
//            <div style="font-size: 0.875rem; line-height: 1.4;">${message}</div>
//            <button onclick="loadShopData()" style="
//                margin-top: 1rem;
//                padding: 0.5rem 1rem;
//                background: #2563eb;
//                color: white;
//                border: none;
//                border-radius: 0.375rem;
//                cursor: pointer;
//                font-size: 0.875rem;
//            ">Попробовать снова</button>
//        </div>
//    `
//        domCache.sidebarContent.style.display = "block"
//    }
//}

//// Panel functions
//function togglePanel() {
//    if (isPanelOpen) {
//        closePanel()
//    } else {
//        openPanel()
//    }
//}

//function openPanel() {
//    if (domCache.sidebar && domCache.panelToggle) {
//        domCache.sidebar.classList.add("open")
//        domCache.panelToggle.classList.add("panel-open")
//        domCache.panelToggle.innerHTML = "📊"
//        isPanelOpen = true
//    }
//}

//function closePanel() {
//    if (domCache.sidebar && domCache.panelToggle) {
//        domCache.sidebar.classList.remove("open")
//        domCache.panelToggle.classList.remove("panel-open")
//        domCache.panelToggle.innerHTML = "📊"
//        isPanelOpen = false
//    }
//}

//// GPS and geolocation functions
//function createUserLocationIcon() {
//    const svgContent = `
//    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//        <defs>
//            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
//                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
//                <feMerge>
//                    <feMergeNode in="coloredBlur"/>
//                    <feMergeNode in="SourceGraphic"/>
//                </feMerge>
//            </filter>
//        </defs>
//        <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="3" filter="url(#glow)"/>
//        <circle cx="12" cy="12" r="3" fill="white"/>
//        <circle cx="12" cy="12" r="12" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.3">
//            <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
//            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
//        </circle>
//    </svg>
//`
//    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
//}

//function getUserLocation() {
//    if (!navigator.geolocation) {
//        showLocationNotification("Геолокация не поддерживается вашим браузером", "error")
//        return
//    }

//    showLocationNotification("Определение вашего местоположения...", "info")

//    const options = {
//        enableHighAccuracy: true,
//        timeout: 10000,
//        maximumAge: 60000,
//    }

//    navigator.geolocation.getCurrentPosition(
//        (position) => {
//            const { latitude, longitude, accuracy } = position.coords
//            userLocation = { latitude, longitude, accuracy }
//            showLocationNotification(`Местоположение определено (точность: ${Math.round(accuracy)}м)`, "success")
//            updateUserLocationOnMap(latitude, longitude, accuracy)
//        },
//        (error) => {
//            let errorMessage = "Не удалось определить местоположение"
//            switch (error.code) {
//                case error.PERMISSION_DENIED:
//                    errorMessage = "Доступ к геолокации запрещен. Разрешите доступ в настройках браузера."
//                    break
//                case error.POSITION_UNAVAILABLE:
//                    errorMessage = "Информация о местоположении недоступна"
//                    break
//                case error.TIMEOUT:
//                    errorMessage = "Время ожидания определения местоположения истекло"
//                    break
//            }
//            showLocationNotification(errorMessage, "error")
//            console.error("Ошибка геолокации:", error)
//        },
//        options,
//    )
//}

//function startWatchingLocation() {
//    if (!navigator.geolocation) return

//    const options = {
//        enableHighAccuracy: true,
//        timeout: 15000,
//        maximumAge: 30000,
//    }

//    watchId = navigator.geolocation.watchPosition(
//        (position) => {
//            const { latitude, longitude, accuracy } = position.coords
//            userLocation = { latitude, longitude, accuracy }
//            updateUserLocationOnMap(latitude, longitude, accuracy)
//        },
//        (error) => {
//            console.error("Ошибка отслеживания местоположения:", error)
//        },
//        options,
//    )
//}

//function stopWatchingLocation() {
//    if (watchId !== null) {
//        navigator.geolocation.clearWatch(watchId)
//        watchId = null
//    }
//}

//function updateUserLocationOnMap(latitude, longitude, accuracy) {
//    if (!map) return

//    if (userLocationMarker) {
//        map.geoObjects.remove(userLocationMarker)
//    }

//    userLocationMarker = new ymaps.Placemark(
//        [latitude, longitude],
//        {
//            balloonContent: `
//          <div style="padding: 10px; text-align: center;">
//              <div style="font-weight: 600; margin-bottom: 5px;">📍 Ваше местоположение</div>
//              <div style="font-size: 12px; color: #666;">
//                  Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
//                  Точность: ${Math.round(accuracy)} метров
//              </div>
//              <button onclick="centerOnUserLocation()" style="
//                  margin-top: 8px;
//                  padding: 4px 8px;
//                  background: #3b82f6;
//                  color: white;
//                  border: none;
//                  border-radius: 4px;
//                  font-size: 12px;
//                  cursor: pointer;
//              ">Центрировать карту</button>
//          </div>
//      `,
//            hintContent: "Ваше текущее местоположение",
//        },
//        {
//            iconLayout: "default#image",
//            iconImageHref: createUserLocationIcon(),
//            iconImageSize: [24, 24],
//            iconImageOffset: [-12, -12],
//            balloonOffset: [0, -10],
//        },
//    )

//    map.geoObjects.add(userLocationMarker)
//}

//function centerOnUserLocation() {
//    if (userLocation && map) {
//        map.setCenter([userLocation.latitude, userLocation.longitude], 16, {
//            duration: 600,
//            timingFunction: "ease-out",
//        })
//        if (userLocationMarker) {
//            userLocationMarker.balloon.open()
//        }
//    } else {
//        getUserLocation()
//    }
//}

//// Utility functions
//function getDistance(lat1, lon1, lat2, lon2) {
//    const R = 6371000
//    const toRad = (x) => (x * Math.PI) / 180
//    const dLat = toRad(lat2 - lat1)
//    const dLon = toRad(lon2 - lon1)
//    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
//    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//    return R * c
//}

//function getStatusInfo(status) {
//    switch (status) {
//        case 0:
//            return { text: "Новый", class: "pending", icon: "🕓" }
//        case 1:
//            return { text: "Активный", class: "active", icon: "✅" }
//        case 2:
//            return { text: "Неактивный", class: "inactive", icon: "❌" }
//        default:
//            return { text: "Неизвестно", class: "review", icon: "❓" }
//    }
//}

//// Icon cache and creation
//const iconCache = new Map()

//function createCustomIcon(iconColor, iconSize, displayText) {
//    const cacheKey = `${iconColor}-${iconSize[0]}-${iconSize[1]}-${displayText}`
//    if (iconCache.has(cacheKey)) {
//        return iconCache.get(cacheKey)
//    }

//    const radius = iconSize[0] / 2 - 3
//    const cx = iconSize[0] / 2
//    const cy = iconSize[1] / 2
//    const randomId = Math.random().toString(36).substr(2, 9)

//    const svgContent = `
//    <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 ${iconSize[0]} ${iconSize[1]}" xmlns="http://www.w3.org/2000/svg">
//        <defs>
//            <filter id="shadow-${randomId}" x="-50%" y="-50%" width="200%" height="200%">
//                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
//            </filter>
//        </defs>
//        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${iconColor}" stroke="white" stroke-width="3"/>
//        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
//              fill="white" font-family="Arial, sans-serif" font-size="${iconSize[0] / 2.2}" font-weight="bold">
//            ${displayText}
//        </text>
//    </svg>
//`

//    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
//    iconCache.set(cacheKey, dataUrl)
//    return dataUrl
//}

//// Data conversion functions
//function convertLocationDataToShops(locations) {
//    console.log("Raw locations from backend:", locations) // Log raw data
//    return locations.map((location, index) => ({
//        id: location.id, // Use the unique ID from backend
//        name: location.marketName || `Магазин ${index + 1}`,
//        address:
//            location.latitude != null && location.longitude != null
//                ? `Координаты: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
//                : "Координаты отсутствуют",
//        description: location.notes || `${location.marketName || "Магазин"} - Партнерская торговая точка`,
//        agent: location.agentName || "Не указан",
//        phone: location.marketNumber || "Не указан",
//        createdAt: location.createdAt,
//        status: location.status === 1 ? "active" : location.status === 0 ? "pending" : "inactive",
//        notes: location.notes || "",
//        latitude: location.latitude,
//        longitude: location.longitude,
//        originalStatus: location.status,
//        clientId: location.clientId || null,
//        totalUsd: location.totalUsd || 0,
//        telegramUserId: location.telegramUserId,
//        lastVisit: location.visitedAt, // This is the key property for color logic
//        marketName: location.marketName, // Keep original marketName for API calls
//        photoUrl: location.photoUrl, // Add photoUrl
//    }))
//}

//// Notes editing functions
//async function updateShopNotes(shopId, newNotes) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    try {
//        const shop = allShops.find((s) => s.id === numericShopId)
//        if (!shop) {
//            throw new Error("Магазин не найден")
//        }

//        const response = await fetch("/update-notes", {
//            method: "POST",
//            headers: {
//                "Content-Type": "application/json",
//            },
//            body: JSON.stringify({
//                telegramUserId: shop.telegramUserId,
//                marketNumber: shop.phone,
//                notes: newNotes,
//            }),
//        })

//        if (!response.ok) {
//            const errorText = await response.text()
//            throw new Error(`HTTP ${response.status}: ${errorText}`)
//        }

//        // Update local data
//        shop.notes = newNotes
//        shop.description = newNotes || `${shop.name} - Партнерская торговая точка`

//        // Update UI
//        updateMap()
//        if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
//            renderShops()
//        }

//        showLocationNotification("Заметки успешно обновлены", "success")
//        return true
//    } catch (error) {
//        console.error("Ошибка обновления заметок:", error)
//        showLocationNotification(`Ошибка обновления: ${error.message}`, "error")
//        return false
//    }
//}

//function startEditingNotes(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
//    if (!editContainer) return

//    const displayDiv = editContainer.querySelector(".notes-display")
//    const editForm = editContainer.querySelector(".notes-edit-form")
//    const textarea = editContainer.querySelector(".notes-textarea")
//    const shop = allShops.find((s) => s.id === numericShopId)

//    if (!shop) return

//    displayDiv.style.display = "none"
//    editForm.classList.add("active")
//    textarea.value = shop.notes || ""
//    textarea.focus()
//    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
//}

//function cancelEditingNotes(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
//    if (!editContainer) return

//    const displayDiv = editContainer.querySelector(".notes-display")
//    const editForm = editContainer.querySelector(".notes-edit-form")

//    editForm.classList.remove("active")
//    displayDiv.style.display = "flex"
//}

//async function saveNotesEdit(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
//    if (!editContainer) return

//    const textarea = editContainer.querySelector(".notes-textarea")
//    const saveBtn = editContainer.querySelector(".notes-save-btn")
//    const editForm = editContainer.querySelector(".notes-edit-form")
//    const displayDiv = editContainer.querySelector(".notes-display")
//    const newNotes = textarea.value.trim()

//    // Show loading state
//    editContainer.classList.add("notes-saving")
//    saveBtn.disabled = true
//    saveBtn.textContent = "Сохранение..."

//    const success = await updateShopNotes(numericShopId, newNotes)

//    // Remove loading state
//    editContainer.classList.remove("notes-saving")
//    saveBtn.disabled = false
//    saveBtn.textContent = "Сохранить"

//    if (success) {
//        editForm.classList.remove("active")
//        displayDiv.style.display = "flex"

//        // Update displayed text
//        const notesText = editContainer.querySelector(".notes-text")
//        if (notesText) {
//            notesText.textContent = newNotes || "Нет заметок"
//        }
//    }
//}

//// Data loading function
//async function loadShopData(showNotification = false) {
//    try {
//        const timestamp = Date.now()
//        const url = `locations.json?v=${timestamp}`

//        const response = await fetch(url, {
//            method: "GET",
//            headers: {
//                "Cache-Control": "no-cache, no-store, must-revalidate",
//                Pragma: "no-cache",
//                Expires: "0",
//            },
//        })

//        if (!response.ok) {
//            throw new Error(`HTTP ошибка! статус: ${response.status}`)
//        }

//        const locations = await response.json()

//        if (!Array.isArray(locations)) {
//            throw new Error("Неверный формат данных")
//        }

//        const newDataHash = generateDataHash(locations)
//        const dataChanged = lastDataHash !== null && lastDataHash !== newDataHash

//        if (dataChanged || allShops.length === 0) {
//            allShops = convertLocationDataToShops(locations)
//            lastDataHash = newDataHash

//            // Only filter if a search term is already active
//            if (searchTerm !== "") {
//                filterShops(searchTerm) // Re-apply filter to update search results
//            } else {
//                // If no search term, just update UI normally
//                updateUI()
//            }

//            updateMap()

//            if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
//                renderShops()
//            }

//            if (showNotification && dataChanged) {
//                showUpdateNotification()
//            }

//            console.log(`${dataChanged ? "Обновлено" : "Загружено"} ${allShops.length} магазинов из locations.json`)
//        }
//    } catch (error) {
//        console.error("Ошибка загрузки локаций:", error)

//        if (allShops.length === 0) {
//            showErrorMessage("Не удалось загрузить данные магазинов. Проверьте наличие файла locations.json")
//        }
//    }
//}

//// Filter shops based on search term
//function filterShops(query) {
//    searchTerm = query.toLowerCase().trim()
//    const statusOverview = document.querySelector(".status-overview")

//    if (searchTerm === "") {
//        filteredShops = allShops // IMPORTANT: When search is empty, filteredShops should be all shops
//        isSearchActive = false
//        if (domCache.sidebarSearchResultsList) {
//            domCache.sidebarSearchResultsList.innerHTML = "" // Clear search results display
//            domCache.sidebarSearchResultsList.classList.remove("active") // Hide results
//        }
//        // Show main sidebar content
//        if (domCache.sidebarContent) {
//            domCache.sidebarContent.style.display = "block"
//        }
//        if (statusOverview) {
//            statusOverview.style.display = "block"
//        }
//        updateShopsList() // Re-render main list when search is cleared
//    } else {
//        filteredShops = allShops.filter(
//            (shop) =>
//                shop.name.toLowerCase().includes(searchTerm) ||
//                shop.agent.toLowerCase().includes(searchTerm) ||
//                shop.phone.toLowerCase().includes(searchTerm),
//        )
//        isSearchActive = true
//        if (domCache.sidebarSearchResultsList) {
//            domCache.sidebarSearchResultsList.classList.add("active") // Show results
//        }
//        // Hide main sidebar content when search results are active
//        if (domCache.sidebarContent) {
//            domCache.sidebarContent.style.display = "none"
//        }
//        if (statusOverview) {
//            statusOverview.style.display = "none"
//        }
//    }
//    currentPage = 0 // Reset to first page on new search
//    renderSidebarSearchResults() // Render results in sidebar search panel
//    renderShops() // Update popup if open (popup uses filteredShops)
//}

//// UI update functions
//function updateUI() {
//    const shopCount = allShops.length // Total shops
//    const activeCount = allShops.filter((s) => s.status === "active").length
//    const pendingCount = allShops.filter((s) => s.status === "pending").length
//    const inactiveCount = allShops.filter((s) => s.status === "inactive").length

//    if (domCache.sidebarSubtitle) {
//        domCache.sidebarSubtitle.textContent = `${shopCount} магазинов в сети`
//    }
//    if (domCache.activeCount) domCache.activeCount.textContent = activeCount
//    if (domCache.pendingCount) domCache.pendingCount.textContent = pendingCount
//    if (domCache.inactiveCount) domCache.inactiveCount.textContent = inactiveCount
//    if (domCache.popupSubtitle) {
//        domCache.popupSubtitle.textContent = `Найдено ${filteredShops.length} магазинов`
//    }

//    if (domCache.sidebarLoading) domCache.sidebarLoading.style.display = "none"

//    // Only update visibility of sidebarContent if not currently in search mode
//    const statusOverview = document.querySelector(".status-overview")
//    if (!isSearchActive) {
//        if (domCache.sidebarContent) {
//            domCache.sidebarContent.style.display = "block"
//        }
//        if (statusOverview) {
//            statusOverview.style.display = "block"
//        }
//        updateShopsList() // Ensure main list is updated when not searching
//    } else {
//        // If search is active, ensure main content is hidden
//        if (domCache.sidebarContent) {
//            domCache.sidebarContent.style.display = "none"
//        }
//        if (statusOverview) {
//            statusOverview.style.display = "none"
//        }
//    }
//}

//function getStatusText(status) {
//    switch (status) {
//        case "active":
//            return "Активный"
//        case "pending":
//            return "В ожидании"
//        case "inactive":
//            return "Неактивный"
//        default:
//            return "Неизвестно"
//    }
//}

//function updateShopsList() {
//    if (!domCache.shopsList) return

//    // Always display the top 8 of ALL shops in the main sidebar list
//    // This list should not be affected by the search term
//    const displayShops = allShops.slice(0, 8) // Use allShops here
//    const html = displayShops
//        .map(
//            (shop) => `
//        <div class="shop-item ${selectedShopId === shop.id ? "selected" : ""}" onclick="selectShop('${shop.id}')">
//            <div class="shop-item-header">
//                <div class="shop-item-name">${shop.name}</div>
//                <div class="shop-item-status ${shop.status}">${getStatusText(shop.status)}</div>
//            </div>
//            <div class="shop-item-details">
//                Агент: ${shop.agent}<br>
//                Телефон: ${shop.phone}
//            </div>
//        </div>
//    `,
//        )
//        .join("")

//    domCache.shopsList.innerHTML = html
//}

//function selectShop(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    selectedShopId = numericShopId

//    const shop = allShops.find((s) => s.id === numericShopId) // Use numericShopId for lookup

//    if (shop && map && shop.latitude && shop.longitude) {
//        map
//            .setCenter([shop.latitude, shop.longitude], 16, {
//                duration: 600,
//                timingFunction: "ease-out",
//            })
//            .then(() => {
//                // Find the placemark by its stored shopId (which is a number)
//                const targetPlacemark = placemarks.find((placemark) => placemark.properties.get("shopId") === numericShopId)
//                if (targetPlacemark) {
//                    targetPlacemark.balloon.open()
//                }
//            })
//    }

//    updateShopsList()
//    // Close sidebar search results when a shop is selected
//    if (domCache.sidebarSearchResultsList) {
//        domCache.sidebarSearchResultsList.classList.remove("active")
//        domCache.sidebarSearchInput.value = "" // Clear search input
//        filterShops("") // Reset filter, which will also show main content
//    }
//}

//function formatDateRussian(dateString) {
//    if (!dateString) return "Дата не указана"

//    const months = [
//        "января",
//        "февраля",
//        "марта",
//        "апреля",
//        "мая",
//        "июня",
//        "июля",
//        "августа",
//        "сентября",
//        "октября",
//        "ноября",
//        "декабря",
//    ]

//    try {
//        const date = new Date(dateString)
//        if (isNaN(date.getTime())) return "Неверная дата"

//        const day = date.getDate()
//        const month = months[date.getMonth()]
//        const year = date.getFullYear()
//        return `${day} ${month} ${year} г.`
//    } catch (error) {
//        console.error("Error formatting date:", error)
//        return "Ошибка даты"
//    }
//}

//// Map update function
//function updateMap() {
//    if (!map) return

//    // Clear existing placemarks (except user location)
//    placemarks.forEach((placemark) => {
//        map.geoObjects.remove(placemark)
//    })
//    placemarks.length = 0

//    // Group shops by proximity
//    const groups = []
//    allShops.forEach((shop) => {
//        if (!shop.latitude || !shop.longitude) return

//        const group = groups.find((g) => getDistance(g[0].latitude, g[0].longitude, shop.latitude, shop.longitude) <= 50)
//        if (group) {
//            group.push(shop)
//        } else {
//            groups.push([shop])
//        }
//    })

//    groups.forEach((group) => {
//        const lat = group[0].latitude
//        const lon = group[0].longitude

//        // Create balloon content
//        const storeCardsHtml = group
//            .map((shop) => {
//                const statusInfo = getStatusInfo(shop.originalStatus)
//                const yandexGoUrl = `https://3.redirect.appmetrica.yandex.com/route?end-lat=${shop.latitude}&end-lon=${shop.longitude}&appmetrica_tracking_id=1178268795219780156`

//                let distanceText = ""
//                if (userLocation) {
//                    const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
//                    if (distance < 1000) {
//                        distanceText = `<div style="font-size: 11px; color: #059669; margin-top: 4px;">📍 ${Math.round(distance)} м от вас</div>`
//                    } else {
//                        distanceText = `<div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
//                    }
//                }

//                let photoHtml = ""
//                if (shop.photoUrl) {
//                    photoHtml = `
//          <div class="market-photo-container" onclick="openPhotoModal('${shop.photoUrl}', '${shop.name}')" style="margin-bottom: 12px; cursor: pointer;">
//            <img src="${shop.photoUrl}" alt="Фото ${shop.name}" class="market-photo" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" onerror="this.parentElement.innerHTML='<div style=\\"padding: 20px; text-align: center; color: #6b7280; border: 2px dashed #d1d5db; border-radius: 8px;\\">
//          </div>
//        `
//                } else {
//                    photoHtml = `
//          <div style="padding: 20px; text-align: center; color: #6b7280; border: 2px dashed #d1d5db; border-radius: 8px; margin-bottom: 12px;">
//            📷 Фото отсутствует
//          </div>
//        `
//                }

//                return `
//        <div class="store-card">
//          ${photoHtml}
//          <div class="store-header">
//            <div class="store-name">${shop.name}</div>
//          </div>
//          <div class="store-details">
//            <div class="detail-row">
//              <div class="detail-icon-wrapper agent">
//                <span class="detail-icon">👤</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Агент</span>
//                <span class="detail-value">${shop.agent}</span>
//              </div>
//            </div>
//            <div class="detail-row">
//              <div class="detail-icon-wrapper phone">
//                <span class="detail-icon">📞</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Телефон</span>
//                <span class="detail-value">
//                  <a href="tel:${shop.phone}" style="color: #2563eb; text-decoration: none;">
//                    ${shop.phone}
//                  </a>
//                </span>
//              </div>
//            </div>
//            ${shop.clientId
//                        ? `
//                <div class="detail-row">
//                  <div class="detail-icon-wrapper client">
//                    <span class="detail-icon">🆔</span>
//                  </div>
//                  <div class="detail-content">
//                    <span class="detail-label">ID Клиента</span>
//                    <span class="detail-value">${shop.clientId}</span>
//                  </div>
//                </div>
//              `
//                        : ""
//                    }
//            <div class="detail-row">
//              <div class="detail-icon-wrapper money">
//                <span class="detail-icon">💰</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Общая сумма</span>
//                <span class="detail-value">$${shop.totalUsd.toFixed(2)}</span>
//              </div>
//            </div>
//            <div class="detail-row">
//              <div class="detail-icon-wrapper date">
//                <span class="detail-icon">📅</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Добавлено</span>
//                <span class="detail-value">${formatDateRussian(shop.createdAt)}</span>
//              </div>
//            </div>

//            <div class="detail-row">
//              <div class="detail-icon-wrapper date">
//                <span class="detail-icon">🗓️</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Последний визит</span>
//                <span class="detail-value">${formatDateRussian(shop.lastVisit)}</span>
//              </div>
//            </div>
//            <div class="detail-row">
//              <div class="detail-icon-wrapper status">
//                <span class="detail-icon">${statusInfo.icon}</span>
//              </div>
//              <div class="detail-content">
//                <span class="detail-label">Статус</span>
//                <span class="detail-value">
//                  <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
//                </span>
//              </div>
//            </div>
//            ${shop.notes
//                        ? `
//                <div class="detail-row">
//                  <div class="detail-icon-wrapper notes">
//                    <span class="detail-icon">📝</span>
//                  </div>
//                  <div class="detail-content">
//                    <span class="detail-label">Заметки</span>
//                    <div class="notes-edit-container" data-shop-id="${shop.id}">
//                      <div class="notes-display">
//                        <span class="detail-value notes-text">${shop.notes}</span>
//                      </div>
//                      <div class="notes-edit-form">
//                        <textarea class="notes-textarea" placeholder="Введите заметки...">${shop.notes}</textarea>
//                        <div class="notes-edit-actions">
//                          <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
//                          <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
//                        </div>
//                      </div>
//                    </div>
//                  </div>
//                </div>
//              `
//                        : `
//                <div class="detail-row">
//                  <div class="detail-icon-wrapper notes">
//                    <span class="detail-icon">📝</span>
//                  </div>
//                  <div class="detail-content">
//                    <span class="detail-label">Заметки</span>
//                    <div class="notes-edit-container" data-shop-id="${shop.id}">
//                      <div class="notes-display">
//                        <span class="detail-value notes-text">Нет заметок</span>
//                        <button class="edit-notes-btn" onclick="startEditingNotes('${shop.id}')" title="Добавить заметки">
//                          ✏️
//                        </button>
//                      </div>
//                      <div class="notes-edit-form">
//                        <textarea class="notes-textarea" placeholder="Введите заметки..."></textarea>
//                        <div class="notes-edit-actions">
//                          <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
//                          <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
//                        </div>
//                      </div>
//                    </div>
//                  </div>
//                </div>
//              `
//                    }
//            <a href="${yandexGoUrl}" target="_blank" class="route-button">
//              🚗 Построить маршрут
//            </a>
//            <button class="visited-button" onclick="markVisited('${shop.id}')">
//              ✅ Отметить как посещённый
//            </button>
//          </div>
//        </div>
//      `
//            })
//            .join("")

//        const content = `
//          <div class="modern-balloon">
//              <div class="balloon-header">
//                  <h3 class="balloon-main-title">
//                      ${group.length > 1 ? `Группа магазинов` : "Партнерский магазин"}
//                  </h3>
//                  ${group.length > 1 ? `<p class="balloon-subtitle">${group.length} магазинов в этой области</p>` : ""}
//              </div>
//              <div class="balloon-content">
//                  ${storeCardsHtml}
//              </div>
//          </div>
//      `

//        let iconColor
//        if (group.length === 1) {
//            const shop = group[0]
//            console.log(`Shop: ${shop.name}, lastVisit: ${shop.lastVisit}`) // Log lastVisit
//            if (shop.lastVisit === null || shop.lastVisit === undefined || shop.lastVisit === "") {
//                iconColor = "#ef4444" // Red for "never visited" or invalid date string
//                console.log(`  -> Color: Red (never visited or invalid date string)`)
//            } else {
//                const visitedDate = new Date(shop.lastVisit)
//                if (isNaN(visitedDate.getTime())) {
//                    iconColor = "#ef4444" // Red for invalid date format
//                    console.log(`  -> Color: Red (invalid date format for lastVisit: ${shop.lastVisit})`)
//                } else {
//                    const diffInDays = (Date.now() - visitedDate.getTime()) / (1000 * 60 * 60 * 24)
//                    console.log(`  -> diffInDays: ${diffInDays}`)
//                    if (diffInDays <= 7) {
//                        // Green if visited within the last 7 days
//                        iconColor = "#10b981"
//                        console.log(`  -> Color: Green (visited within 7 days)`)
//                    } else if (diffInDays <= 15) {
//                        // Yellow if visited 7-15 days ago
//                        iconColor = "#fbbf24"
//                        console.log(`  -> Color: Yellow (visited 7-15 days ago)`)
//                    } else {
//                        // Red if visited more than 15 days ago
//                        iconColor = "#ef4444"
//                        console.log(`  -> Color: Red (visited more than 15 days ago)`)
//                    }
//                }
//            }
//        } else {
//            iconColor = "#3b82f6" // Keep group color as blue
//            console.log(`  -> Color: Blue (group)`)
//        }

//        const iconSize = group.length > 1 ? [36, 36] : [28, 28]
//        const iconOffset = group.length > 1 ? [-18, -36] : [-14, -28]
//        const displayText = group.length > 1 ? group.length.toString() : "М"

//        const placemark = new ymaps.Placemark(
//            [lat, lon],
//            {
//                balloonContent: content,
//                hintContent: group.length > 1 ? `Группа из ${group.length} магазинов` : group[0].name,
//                shopId: group[0].id, // Store the shop ID on the placemark properties (as a number)
//            },
//            {
//                iconLayout: "default#image",
//                iconImageHref: createCustomIcon(iconColor, iconSize, displayText),
//                iconImageSize: iconSize,
//                iconImageOffset: iconOffset,
//                hideIconOnBalloonOpen: false,
//                balloonAutoPan: true,
//                balloonOffset: [0, -10],
//            },
//        )

//        placemark.events.add("click", (e) => {
//            e.stopPropagation()
//            const coords = placemark.geometry.getCoordinates()
//            map
//                .setCenter(coords, Math.max(map.getZoom(), 15), {
//                    duration: 400,
//                    timingFunction: "ease-out",
//                })
//                .then(() => {
//                    placemark.balloon.open()
//                })
//        })

//        map.geoObjects.add(placemark)
//        placemarks.push(placemark)
//    })
//}

//// Map initialization
//function initMap() {
//    ymaps.ready(() => {
//        map = new ymaps.Map(
//            "map",
//            {
//                center: [41.31, 69.28],
//                zoom: 11,
//                controls: ["zoomControl", "fullscreenControl", "typeSelector"],
//                suppressMapOpenBlock: true,
//                yandexMapDisablePoiInteractivity: true,
//            },
//            {
//                suppressMapOpenBlock: true,
//                avoidFractionalZoom: false,
//                restrictMapArea: false,
//            },
//        )

//        // Add location button
//        const locationButton = new ymaps.control.Button({
//            data: {
//                content: "📍",
//                title: "Показать мое местоположение",
//            },
//            options: {
//                selectOnClick: false,
//                maxWidth: 40,
//            },
//        })

//        locationButton.events.add("click", () => {
//            if (userLocation) {
//                centerOnUserLocation()
//            } else {
//                getUserLocation()
//            }
//        })

//        map.controls.add(locationButton, {
//            position: { right: 10, top: 170 },
//        })

//        map.controls.get("zoomControl").options.set({
//            size: "large",
//            position: { right: 10, top: 50 },
//            adjustMapMargin: false,
//        })

//        map.controls.get("fullscreenControl").options.set({
//            position: { right: 10, top: 110 },
//            adjustMapMargin: false,
//        })

//        map.events.add("click", (e) => {
//            map.balloon.close()
//        })

//        // Load initial data
//        loadShopData()

//        // Start auto-update
//        startAutoUpdate()

//        // Get user location automatically
//        setTimeout(() => {
//            getUserLocation()
//            startWatchingLocation()
//        }, 1000)
//    })
//}

//// Auto-update functions
//function startAutoUpdate() {
//    updateInterval = setInterval(() => {
//        loadShopData(true)
//    }, AUTO_UPDATE_INTERVAL)
//}

//function stopAutoUpdate() {
//    if (updateInterval) {
//        clearInterval(updateInterval)
//        updateInterval = null
//    }
//}

//// Popup functions
//function truncateText(text, maxLength = 120) {
//    if (!text || text.length <= maxLength) return text
//    return text.substring(0, maxLength) + "..."
//}

//function toggleDescription(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    if (expandedDescriptions.has(numericShopId)) {
//        expandedDescriptions.delete(numericShopId)
//    } else {
//        expandedDescriptions.add(numericShopId)
//    }
//    renderShops()
//}

//function createShopCard(shop) {
//    const isExpanded = expandedDescriptions.has(shop.id)
//    const description = isExpanded ? shop.description : truncateText(shop.description)
//    const needsExpansion = shop.description && shop.description.length > 120

//    let distanceText = ""
//    if (userLocation && shop.latitude && shop.longitude) {
//        const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
//        if (distance < 1000) {
//            distanceText = `<div style="font-size: 0.75rem; color: #059669; margin-top: 0.25rem;">📍 ${Math.round(distance)} м от вас</div>`
//        } else {
//            distanceText = `<div style="font-size: 0.75rem; color: #3b82f6; margin-top: 0.25rem;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
//        }
//    }

//    const isShopIdValid = shop.id && shop.id !== 0

//    return `
//    <div class="shop-card" data-shop-id="${shop.id}">
//      <div class="shop-header">
//        <h3 class="shop-name">${shop.name}</h3>
//        <span class="status-badge ${shop.status}">${getStatusText(shop.status)}</span>
//      </div>

//      <div class="shop-details">
//        <div class="detail-row">
//          <div class="detail-icon address">📍</div>
//          <div class="detail-content">
//            <div class="detail-label">Адрес клиента</div>
//            <div class="detail-value">${shop.address}${distanceText}</div>
//          </div>
//        </div>

//        <div class="detail-row">
//          <div class="detail-icon agent">👤</div>
//          <div class="detail-content">
//            <div class="detail-label">Агент</div>
//            <div class="detail-value">${shop.agent}</div>
//          </div>
//        </div>

//        <div class="detail-row">
//          <div class="detail-icon phone">📞</div>
//          <div class="detail-content">
//            <div class="detail-label">Телефон</div>
//            <div class="detail-value">
//              <a href="tel:${shop.phone}" class="phone-link">${shop.phone}</a>
//            </div>
//          </div>
//        </div>

//        ${shop.clientId
//            ? `
//            <div class="detail-row">
//              <div class="detail-icon client">🆔</div>
//              <div class="detail-content">
//                <div class="detail-label">ID Клиента</div>
//                <div class="detail-value">${shop.clientId}</div>
//              </div>
//            </div>
//        `
//            : ""
//        }

//        <div class="detail-row">
//          <div class="detail-icon money">💰</div>
//          <div class="detail-content">
//            <div class="detail-label">Общая сумма</div>
//            <div class="detail-value">$${shop.totalUsd.toFixed(2)}</div>
//          </div>
//        </div>

//        <div class="detail-row">
//          <div class="detail-icon notes">📝</div>
//          <div class="detail-content">
//            <div class="detail-label">Заметки</div>
//            <div class="notes-edit-container" data-shop-id="${shop.id}">
//              <div class="notes-display">
//                <div class="detail-value notes-text">${shop.notes || "Нет заметок"}</div>
//                <button class="edit-notes-btn" onclick="startEditingNotes('${shop.id}')" title="Редактировать заметки">
//                  ✏️
//                </button>
//              </div>
//              <div class="notes-edit-form">
//                <textarea class="notes-textarea" placeholder="Введите заметки...">${shop.notes || ""}</textarea>
//                <div class="notes-edit-actions">
//                  <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
//                  <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
//                </div>
//              </div>
//            </div>
//          </div>
//        </div>

//        <div class="detail-row">
//          <div class="detail-icon date">📅</div>
//          <div class="detail-content">
//            <div class="detail-label">Добавлено</div>
//            <div class="detail-value">${formatDateRussian(shop.createdAt)}</div>
//          </div>
//        </div>

//        <div class="detail-row">
//          <div class="detail-icon date">🗓️</div>
//          <div class="detail-content">
//            <div class="detail-label">Последний визит</div>
//            <div class="detail-value">${formatDateRussian(shop.lastVisit)}</div>
//          </div>
//        </div>
//      </div>

//      <button class="view-details-btn" onclick="viewShopDetails('${shop.id}')">
//        Показать на карте
//      </button>

//      <button class="visited-button" ${isShopIdValid ? `onclick="markVisited('${shop.id}')"` : "disabled"} title="${isShopIdValid ? "Отметить как посещённый" : "ID магазина отсутствует"}">
//        ✅ Отметить как посещённый
//      </button>
//    </div>
//  `
//}

//function openPhotoModal(photoUrl, shopName) {
//    const photoModalOverlay = document.getElementById("photoModalOverlay")
//    const photoModalTitle = document.getElementById("photoModalTitle")
//    const photoModalImage = document.getElementById("photoModalImage")

//    if (photoModalOverlay && photoModalTitle && photoModalImage) {
//        photoModalTitle.textContent = `Фото магазина: ${shopName}`
//        photoModalImage.src = photoUrl
//        photoModalImage.alt = `Фото ${shopName}`
//        photoModalOverlay.classList.add("active")

//        // Prevent body scroll when modal is open
//        document.body.style.overflow = "hidden"
//    }
//}

//function closePhotoModal() {
//    const photoModalOverlay = document.getElementById("photoModalOverlay")

//    if (photoModalOverlay) {
//        photoModalOverlay.classList.remove("active")

//        // Restore body scroll
//        document.body.style.overflow = ""
//    }
//}

//// Close photo modal on Escape key
//document.addEventListener("keydown", (event) => {
//    if (event.key === "Escape") {
//        closePhotoModal()
//    }
//})

//// New: Render search results in the sidebar search panel
//function renderSidebarSearchResults() {
//    if (!domCache.sidebarSearchResultsList) return

//    if (searchTerm === "") {
//        domCache.sidebarSearchResultsList.innerHTML = ""
//        domCache.sidebarSearchResultsList.classList.remove("active")
//        return
//    }

//    if (filteredShops.length === 0) {
//        domCache.sidebarSearchResultsList.innerHTML = '<div class="sidebar-search-no-results">Нет результатов.</div>'
//        domCache.sidebarSearchResultsList.classList.add("active")
//        return
//    }

//    const html = filteredShops
//        .map(
//            (shop) => `
//          <div class="sidebar-search-item" onclick="viewShopDetails('${shop.id}')">
//              <div class="sidebar-search-item-name">${shop.name}</div>
//              <div class="sidebar-search-item-details">Агент: ${shop.agent} | Телефон: ${shop.phone}</div>
//          </div>
//      `,
//        )
//        .join("")

//    domCache.sidebarSearchResultsList.innerHTML = html
//    domCache.sidebarSearchResultsList.classList.add("active")
//}

//function renderShops() {
//    if (!domCache.shopsGrid) return

//    const startIndex = currentPage * itemsPerPage
//    const endIndex = startIndex + itemsPerPage
//    const currentShops = filteredShops.slice(startIndex, endIndex) // Use filteredShops

//    const html = currentShops.map((shop) => createShopCard(shop)).join("")
//    domCache.shopsGrid.innerHTML = html

//    updatePagination()
//}

//function updatePagination() {
//    if (!domCache.paginationInfo || !domCache.pagination || !domCache.paginationControls) return

//    const totalPages = Math.ceil(filteredShops.length / itemsPerPage) // Use filteredShops.length
//    const startIndex = currentPage * itemsPerPage
//    const endIndex = Math.min(startIndex + itemsPerPage, filteredShops.length) // Use filteredShops.length

//    domCache.paginationInfo.textContent = `Показано с ${startIndex + 1} по ${endIndex} из ${filteredShops.length} магазинов` // Use filteredShops.length
//    domCache.pagination.style.display = totalPages > 1 ? "flex" : "none"

//    if (totalPages <= 1) return

//    let html = ""
//    html += `<button class="pagination-btn" ${currentPage === 0 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">‹</button>`

//    const maxVisiblePages = 5
//    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
//    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)

//    if (endPage - startPage < maxVisiblePages - 1) {
//        startPage = Math.max(0, endPage - maxVisiblePages + 1)
//    }

//    for (let i = startPage; i <= endPage; i++) {
//        html += `<button class="pagination-btn ${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i + 1}</button>`
//    }

//    if (endPage < totalPages - 1) {
//        if (endPage < totalPages - 2) {
//            html += '<div class="pagination-ellipsis">...</div>'
//        }
//        html += `<button class="pagination-btn" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`
//    }

//    html += `<button class="pagination-btn" ${currentPage === totalPages - 1 ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">›</button>`

//    domCache.paginationControls.innerHTML = html
//}

//function goToPage(page) {
//    const totalPages = Math.ceil(filteredShops.length / itemsPerPage) // Use filteredShops.length
//    if (page >= 0 && page < totalPages) {
//        currentPage = page
//        renderShops()

//        const popupContent = domCache.popupOverlay?.querySelector(".popup-content")
//        if (popupContent) {
//            popupContent.scrollTop = 0
//        }
//    }
//}

//function openPopup() {
//    // Ensure filteredShops is correctly set to allShops if no search is active
//    if (searchTerm === "") {
//        filteredShops = allShops
//    }

//    if (filteredShops.length === 0) {
//        return
//    }

//    currentPage = 0
//    expandedDescriptions.clear()
//    renderShops()

//    if (domCache.popupOverlay) {
//        domCache.popupOverlay.classList.add("active")
//        document.body.style.overflow = "hidden"

//        setTimeout(() => {
//            const popupContent = domCache.popupOverlay.querySelector(".popup-content")
//            if (popupContent) {
//                popupContent.scrollTop = 0
//            }
//        }, 100)
//    }
//}

//function closePopup() {
//    if (domCache.popupOverlay) {
//        domCache.popupOverlay.classList.remove("active")
//        document.body.style.overflow = "unset"
//    }
//}

//function closePopupOnOverlay(event) {
//    if (event.target === event.currentTarget) {
//        closePopup()
//    }
//}

//function viewShopDetails(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    const shop = allShops.find((s) => s.id === numericShopId) // Use numericShopId for lookup
//    if (shop && map) {
//        closePopup()
//        closePanel()
//        selectShop(numericShopId) // Pass the numeric ID to selectShop
//    }
//}

//// FIXED: Mark as visited function
//async function markVisited(shopId) {
//    // Ensure shopId is a number for lookup
//    const numericShopId = Number(shopId)
//    try {
//        if (!numericShopId || numericShopId === 0) {
//            showLocationNotification("Недостаточно данных для отметки посещения (ID магазина отсутствует)", "error")
//            return
//        }

//        // Prepare the data to send
//        const visitData = {
//            id: numericShopId,
//            visitedAt: new Date().toISOString(),
//        }

//        console.log("Отправка данных о посещении:", visitData)

//        const response = await fetch("/mark-visited", {
//            method: "POST",
//            headers: {
//                "Content-Type": "application/json",
//            },
//            body: JSON.stringify(visitData),
//        })

//        if (response.ok) {
//            const result = await response.text()
//            console.log("Ответ сервера:", result)

//            // Update local data for the specific shop
//            const shopToUpdate = allShops.find((s) => s.id === numericShopId)
//            if (shopToUpdate) {
//                shopToUpdate.lastVisit = visitData.visitedAt
//            }

//            // Update UI
//            updateMap()
//            if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
//                renderShops()
//            }

//            showLocationNotification("✅ Магазин отмечен как посещённый!", "success")

//            // Reload data to get fresh information
//            setTimeout(() => {
//                loadShopData(false)
//            }, 1000)
//        } else {
//            const errorText = await response.text()
//            console.error("Ошибка сервера:", response.status, errorText)
//            showLocationNotification(`❌ Ошибка сервера: ${response.status}`, "error")
//        }
//    } catch (error) {
//        console.error("Ошибка при отметке посещения:", error)
//        showLocationNotification("⚠️ Ошибка при запросе к серверу", "error")
//    }
//}

//// Event handlers
//document.addEventListener("keydown", (event) => {
//    if (event.key === "Escape") {
//        if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
//            closePopup()
//        } else if (isPanelOpen) {
//            closePanel()
//        } else if (
//            domCache.sidebarSearchResultsList &&
//            domCache.sidebarSearchInput &&
//            domCache.sidebarSearchResultsList.classList.contains("active")
//        ) {
//            domCache.sidebarSearchResultsList.classList.remove("active")
//            domCache.sidebarSearchInput.value = "" // Clear search input
//            filterShops("") // Reset filter, which will also show main content
//        }
//    }
//})

//// Application initialization
//document.addEventListener("DOMContentLoaded", () => {
//    console.log("Инициализация приложения...")
//    initDOMCache()
//    initMap()

//    // New: Add event listener for sidebar search input
//    if (domCache.sidebarSearchInput) {
//        domCache.sidebarSearchInput.addEventListener(
//            "input",
//            debounce((event) => {
//                filterShops(event.target.value)
//            }, 300),
//        )
//        // New: Add event listener to hide search results when clicking outside
//        document.addEventListener("click", (event) => {
//            if (
//                domCache.sidebarSearchResultsList &&
//                domCache.sidebarSearchInput &&
//                !domCache.sidebarSearchResultsList.contains(event.target) &&
//                !domCache.sidebarSearchInput.contains(event.target)
//            ) {
//                domCache.sidebarSearchResultsList.classList.remove("active")
//            }
//        })
//    }
//})

//// Cleanup on page unload
//window.addEventListener("beforeunload", () => {
//    stopAutoUpdate()
//    stopWatchingLocation()
//    iconCache.clear()
//    Object.keys(domCache).forEach((key) => delete domCache[key])
//})

//// Make functions globally available
//window.togglePanel = togglePanel
//window.openPanel = openPanel
//window.closePanel = closePanel
//window.getUserLocation = getUserLocation
//window.centerOnUserLocation = centerOnUserLocation
//window.selectShop = selectShop
//window.startEditingNotes = startEditingNotes
//window.cancelEditingNotes = cancelEditingNotes
//window.saveNotesEdit = saveNotesEdit
//window.loadShopData = loadShopData
//window.toggleDescription = toggleDescription
//window.renderShops = renderShops
//window.goToPage = goToPage
//window.openPopup = openPopup
//window.closePopup = closePopup
//window.closePopupOnOverlay = closePopupOnOverlay
//window.viewShopDetails = viewShopDetails
//window.markVisited = markVisited


// Global variables
let allShops = []
let currentPage = 0
const itemsPerPage = 6
const expandedDescriptions = new Set()
let selectedShopId = null
let map = null // Initialize map as null
const placemarks = []
let isPanelOpen = false
let lastDataHash = null
let userLocationMarker = null
let userLocation = null
let watchId = null
const ymaps = window.ymaps // Declare the ymaps variable
let searchTerm = "" // New: Search term
let filteredShops = [] // New: Filtered shops array
let isSearchActive = false // New flag to indicate if search results are active

// Auto-update interval (increased to 5 seconds for better performance)
const AUTO_UPDATE_INTERVAL = 5000
let updateInterval = null // Initialize updateInterval as null

// DOM cache
const domCache = {}

// Initialize DOM cache
function initDOMCache() {
    const elements = [
        "sidebarSubtitle",
        "activeCount",
        "pendingCount",
        "inactiveCount",
        "popupSubtitle",
        "sidebarLoading",
        "sidebarContent",
        "shopsList",
        "shopsGrid",
        "paginationInfo",
        "paginationControls",
        "pagination",
        "updateNotification",
        "popupOverlay",
        "sidebar",
        "panelToggle",
        "sidebarSearchInput", // New: Sidebar search input
        "sidebarSearchResultsList", // New: Sidebar search results list
    ]

    elements.forEach((id) => {
        domCache[id] = document.getElementById(id)
        if (!domCache[id]) {
            console.warn(`Element with id '${id}' not found`)
        }
    })
}

// Utility functions
function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

function throttle(func, limit) {
    let inThrottle
    return function () {
        const args = arguments
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

// Generate hash for data comparison
function generateDataHash(data) {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return hash
}

// Notification functions
function showUpdateNotification() {
    if (domCache.updateNotification) {
        domCache.updateNotification.classList.add("show")
        setTimeout(() => {
            domCache.updateNotification.classList.remove("show")
        }, 2000)
    }
}

function showLocationNotification(message, type = "info") {
    const notification = document.createElement("div")
    const colors = {
        error: "#ef4444",
        success: "#10b981",
        info: "#3b82f6",
    }

    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1003;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
  `

    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
        notification.style.transform = "translateX(0)"
    }, 100)

    setTimeout(() => {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification)
            }
        }, 300)
    }, 4000)
}

function showErrorMessage(message) {
    if (domCache.sidebarLoading) {
        domCache.sidebarLoading.style.display = "none"
    }

    if (domCache.sidebarContent) {
        domCache.sidebarContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #ef4444;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Ошибка загрузки данных</div>
            <div style="font-size: 0.875rem; line-height: 1.4;">${message}</div>
            <button onclick="loadShopData()" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 0.375rem;
                cursor: pointer;
                font-size: 0.875rem;
            ">Попробовать снова</button>
        </div>
    `
        domCache.sidebarContent.style.display = "block"
    }
}

// Panel functions
function togglePanel() {
    if (isPanelOpen) {
        closePanel()
    } else {
        openPanel()
    }
}

function openPanel() {
    if (domCache.sidebar && domCache.panelToggle) {
        domCache.sidebar.classList.add("open")
        domCache.panelToggle.classList.add("panel-open")
        domCache.panelToggle.innerHTML = "📊"
        isPanelOpen = true
    }
}

function closePanel() {
    if (domCache.sidebar && domCache.panelToggle) {
        domCache.sidebar.classList.remove("open")
        domCache.panelToggle.classList.remove("panel-open")
        domCache.panelToggle.innerHTML = "📊"
        isPanelOpen = false
    }
}

// GPS and geolocation functions
function createUserLocationIcon() {
    const svgContent = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="3" filter="url(#glow)"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
        <circle cx="12" cy="12" r="12" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.3">
            <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
    </svg>
`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
}

function getUserLocation() {
    if (!navigator.geolocation) {
        showLocationNotification("Геолокация не поддерживается вашим браузером", "error")
        return
    }

    showLocationNotification("Определение вашего местоположения...", "info")

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords
            userLocation = { latitude, longitude, accuracy }
            showLocationNotification(`Местоположение определено (точность: ${Math.round(accuracy)}м)`, "success")
            updateUserLocationOnMap(latitude, longitude, accuracy)
        },
        (error) => {
            let errorMessage = "Не удалось определить местоположение"
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Доступ к геолокации запрещен. Разрешите доступ в настройках браузера."
                    break
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Информация о местоположении недоступна"
                    break
                case error.TIMEOUT:
                    errorMessage = "Время ожидания определения местоположения истекло"
                    break
            }
            showLocationNotification(errorMessage, "error")
            console.error("Ошибка геолокации:", error)
        },
        options,
    )
}

function startWatchingLocation() {
    if (!navigator.geolocation) return

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords
            userLocation = { latitude, longitude, accuracy }
            updateUserLocationOnMap(latitude, longitude, accuracy)
        },
        (error) => {
            console.error("Ошибка отслеживания местоположения:", error)
        },
        options,
    )
}

function stopWatchingLocation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
    }
}

function updateUserLocationOnMap(latitude, longitude, accuracy) {
    if (!map) return

    if (userLocationMarker) {
        map.geoObjects.remove(userLocationMarker)
    }

    userLocationMarker = new ymaps.Placemark(
        [latitude, longitude],
        {
            balloonContent: `
          <div style="padding: 10px; text-align: center;">
              <div style="font-weight: 600; margin-bottom: 5px;">📍 Ваше местоположение</div>
              <div style="font-size: 12px; color: #666;">
                  Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
                  Точность: ${Math.round(accuracy)} метров
              </div>
              <button onclick="centerOnUserLocation()" style="
                  margin-top: 8px;
                  padding: 4px 8px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: pointer;
              ">Центрировать карту</button>
          </div>
      `,
            hintContent: "Ваше текущее местоположение",
        },
        {
            iconLayout: "default#image",
            iconImageHref: createUserLocationIcon(),
            iconImageSize: [24, 24],
            iconImageOffset: [-12, -12],
            balloonOffset: [0, -10],
        },
    )

    map.geoObjects.add(userLocationMarker)
}

function centerOnUserLocation() {
    if (userLocation && map) {
        map.setCenter([userLocation.latitude, userLocation.longitude], 16, {
            duration: 600,
            timingFunction: "ease-out",
        })
        if (userLocationMarker) {
            userLocationMarker.balloon.open()
        }
    } else {
        getUserLocation()
    }
}

// Utility functions
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000
    const toRad = (x) => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function getStatusInfo(status) {
    switch (status) {
        case 0:
            return { text: "Новый", class: "pending", icon: "🕓" }
        case 1:
            return { text: "Активный", class: "active", icon: "✅" }
        case 2:
            return { text: "Неактивный", class: "inactive", icon: "❌" }
        default:
            return { text: "Неизвестно", class: "review", icon: "❓" }
    }
}

// Icon cache and creation
const iconCache = new Map()

function createCustomIcon(iconColor, iconSize, displayText) {
    const cacheKey = `${iconColor}-${iconSize[0]}-${iconSize[1]}-${displayText}`
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)
    }

    const radius = iconSize[0] / 2 - 3
    const cx = iconSize[0] / 2
    const cy = iconSize[1] / 2
    const randomId = Math.random().toString(36).substr(2, 9)

    const svgContent = `
    <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 ${iconSize[0]} ${iconSize[1]}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="shadow-${randomId}" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
            </filter>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${iconColor}" stroke="white" stroke-width="3"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
              fill="white" font-family="Arial, sans-serif" font-size="${iconSize[0] / 2.2}" font-weight="bold">
            ${displayText}
        </text>
    </svg>
`

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
    iconCache.set(cacheKey, dataUrl)
    return dataUrl
}

// Data conversion functions
function convertLocationDataToShops(locations) {
    console.log("Raw locations from backend:", locations) // Log raw data
    return locations.map((location, index) => ({
        id: location.id, // Use the unique ID from backend
        name: location.marketName || `Магазин ${index + 1}`,
        address:
            location.latitude != null && location.longitude != null
                ? `Координаты: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                : "Координаты отсутствуют",
        description: location.notes || `${location.marketName || "Магазин"} - Партнерская торговая точка`,
        agent: location.agentName || "Не указан",
        phone: location.marketNumber || "Не указан",
        createdAt: location.createdAt,
        status: location.status === 1 ? "active" : location.status === 0 ? "pending" : "inactive",
        notes: location.notes || "",
        latitude: location.latitude,
        longitude: location.longitude,
        originalStatus: location.status,
        clientId: location.clientId || null,
        totalUsd: location.totalUsd || 0,
        telegramUserId: location.telegramUserId,
        lastVisit: location.visitedAt, // This is the key property for color logic
        marketName: location.marketName, // Keep original marketName for API calls
        photoUrl: location.photoUrl, // Add photoUrl
    }))
}

// Notes editing functions
async function updateShopNotes(shopId, newNotes) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    try {
        const shop = allShops.find((s) => s.id === numericShopId)
        if (!shop) {
            throw new Error("Магазин не найден")
        }

        const response = await fetch("/update-notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                telegramUserId: shop.telegramUserId,
                marketNumber: shop.phone,
                notes: newNotes,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        // Update local data
        shop.notes = newNotes
        shop.description = newNotes || `${shop.name} - Партнерская торговая точка`

        // Update UI
        updateMap()
        if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
            renderShops()
        }

        showLocationNotification("Заметки успешно обновлены", "success")
        return true
    } catch (error) {
        console.error("Ошибка обновления заметок:", error)
        showLocationNotification(`Ошибка обновления: ${error.message}`, "error")
        return false
    }
}

function startEditingNotes(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
    if (!editContainer) return

    const displayDiv = editContainer.querySelector(".notes-display")
    const editForm = editContainer.querySelector(".notes-edit-form")
    const textarea = editContainer.querySelector(".notes-textarea")
    const shop = allShops.find((s) => s.id === numericShopId)

    if (!shop) return

    displayDiv.style.display = "none"
    editForm.classList.add("active")
    textarea.value = shop.notes || ""
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
}

function cancelEditingNotes(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
    if (!editContainer) return

    const displayDiv = editContainer.querySelector(".notes-display")
    const editForm = editContainer.querySelector(".notes-edit-form")

    editForm.classList.remove("active")
    displayDiv.style.display = "flex"
}

async function saveNotesEdit(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    const editContainer = document.querySelector(`[data-shop-id="${numericShopId}"] .notes-edit-container`)
    if (!editContainer) return

    const textarea = editContainer.querySelector(".notes-textarea")
    const saveBtn = editContainer.querySelector(".notes-save-btn")
    const editForm = editContainer.querySelector(".notes-edit-form")
    const displayDiv = editContainer.querySelector(".notes-display")
    const newNotes = textarea.value.trim()

    // Show loading state
    editContainer.classList.add("notes-saving")
    saveBtn.disabled = true
    saveBtn.textContent = "Сохранение..."

    const success = await updateShopNotes(numericShopId, newNotes)

    // Remove loading state
    editContainer.classList.remove("notes-saving")
    saveBtn.disabled = false
    saveBtn.textContent = "Сохранить"

    if (success) {
        editForm.classList.remove("active")
        displayDiv.style.display = "flex"

        // Update displayed text
        const notesText = editContainer.querySelector(".notes-text")
        if (notesText) {
            notesText.textContent = newNotes || "Нет заметок"
        }
    }
}

// Data loading function
async function loadShopData(showNotification = false) {
    try {
        const timestamp = Date.now()
        const url = `locations.json?v=${timestamp}`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        })

        if (!response.ok) {
            throw new Error(`HTTP ошибка! статус: ${response.status}`)
        }

        const locations = await response.json()

        if (!Array.isArray(locations)) {
            throw new Error("Неверный формат данных")
        }

        const newDataHash = generateDataHash(locations)
        const dataChanged = lastDataHash !== null && lastDataHash !== newDataHash

        if (dataChanged || allShops.length === 0) {
            allShops = convertLocationDataToShops(locations)
            lastDataHash = newDataHash

            // Only filter if a search term is already active
            if (searchTerm !== "") {
                filterShops(searchTerm) // Re-apply filter to update search results
            } else {
                // If no search term, just update UI normally
                updateUI()
            }

            updateMap()

            if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
                renderShops()
            }

            if (showNotification && dataChanged) {
                showUpdateNotification()
            }

            console.log(`${dataChanged ? "Обновлено" : "Загружено"} ${allShops.length} магазинов из locations.json`)
        }
    } catch (error) {
        console.error("Ошибка загрузки локаций:", error)

        if (allShops.length === 0) {
            showErrorMessage("Не удалось загрузить данные магазинов. Проверьте наличие файла locations.json")
        }
    }
}

// Filter shops based on search term
function filterShops(query) {
    searchTerm = query.toLowerCase().trim()
    const statusOverview = document.querySelector(".status-overview")

    if (searchTerm === "") {
        filteredShops = allShops // IMPORTANT: When search is empty, filteredShops should be all shops
        isSearchActive = false
        if (domCache.sidebarSearchResultsList) {
            domCache.sidebarSearchResultsList.innerHTML = "" // Clear search results display
            domCache.sidebarSearchResultsList.classList.remove("active") // Hide results
        }
        // Show main sidebar content
        if (domCache.sidebarContent) {
            domCache.sidebarContent.style.display = "block"
        }
        if (statusOverview) {
            statusOverview.style.display = "block"
        }
        updateShopsList() // Re-render main list when search is cleared
    } else {
        filteredShops = allShops.filter(
            (shop) =>
                shop.name.toLowerCase().includes(searchTerm) ||
                shop.agent.toLowerCase().includes(searchTerm) ||
                shop.phone.toLowerCase().includes(searchTerm),
        )
        isSearchActive = true
        if (domCache.sidebarSearchResultsList) {
            domCache.sidebarSearchResultsList.classList.add("active") // Show results
        }
        // Hide main sidebar content when search results are active
        if (domCache.sidebarContent) {
            domCache.sidebarContent.style.display = "none"
        }
        if (statusOverview) {
            statusOverview.style.display = "none"
        }
    }
    currentPage = 0 // Reset to first page on new search
    renderSidebarSearchResults() // Render results in sidebar search panel
    renderShops() // Update popup if open (popup uses filteredShops)
}

// UI update functions
function updateUI() {
    const shopCount = allShops.length // Total shops
    const activeCount = allShops.filter((s) => s.status === "active").length
    const pendingCount = allShops.filter((s) => s.status === "pending").length
    const inactiveCount = allShops.filter((s) => s.status === "inactive").length

    if (domCache.sidebarSubtitle) {
        domCache.sidebarSubtitle.textContent = `${shopCount} магазинов в сети`
    }
    if (domCache.activeCount) domCache.activeCount.textContent = activeCount
    if (domCache.pendingCount) domCache.pendingCount.textContent = pendingCount
    if (domCache.inactiveCount) domCache.inactiveCount.textContent = inactiveCount
    if (domCache.popupSubtitle) {
        domCache.popupSubtitle.textContent = `Найдено ${filteredShops.length} магазинов`
    }

    if (domCache.sidebarLoading) domCache.sidebarLoading.style.display = "none"

    // Only update visibility of sidebarContent if not currently in search mode
    const statusOverview = document.querySelector(".status-overview")
    if (!isSearchActive) {
        if (domCache.sidebarContent) {
            domCache.sidebarContent.style.display = "block"
        }
        if (statusOverview) {
            statusOverview.style.display = "block"
        }
        updateShopsList() // Ensure main list is updated when not searching
    } else {
        // If search is active, ensure main content is hidden
        if (domCache.sidebarContent) {
            domCache.sidebarContent.style.display = "none"
        }
        if (statusOverview) {
            statusOverview.style.display = "none"
        }
    }
}

function getStatusText(status) {
    switch (status) {
        case "active":
            return "Активный"
        case "pending":
            return "В ожидании"
        case "inactive":
            return "Неактивный"
        default:
            return "Неизвестно"
    }
}

function updateShopsList() {
    if (!domCache.shopsList) return

    // Always display the top 8 of ALL shops in the main sidebar list
    // This list should not be affected by the search term
    const displayShops = allShops.slice(0, 8) // Use allShops here
    const html = displayShops
        .map(
            (shop) => `
        <div class="shop-item ${selectedShopId === shop.id ? "selected" : ""}" onclick="selectShop('${shop.id}')">
            <div class="shop-item-header">
                <div class="shop-item-name">${shop.name}</div>
                <div class="shop-item-status ${shop.status}">${getStatusText(shop.status)}</div>
            </div>
            <div class="shop-item-details">
                Агент: ${shop.agent}<br>
                Телефон: ${shop.phone}
            </div>
        </div>
    `,
        )
        .join("")

    domCache.shopsList.innerHTML = html
}

function selectShop(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    selectedShopId = numericShopId

    const shop = allShops.find((s) => s.id === numericShopId) // Use numericShopId for lookup

    if (shop && map && shop.latitude && shop.longitude) {
        map
            .setCenter([shop.latitude, shop.longitude], 16, {
                duration: 600,
                timingFunction: "ease-out",
            })
            .then(() => {
                // Find the placemark by its stored shopId (which is a number)
                const targetPlacemark = placemarks.find((placemark) => placemark.properties.get("shopId") === numericShopId)
                if (targetPlacemark) {
                    targetPlacemark.balloon.open()
                }
            })
    }

    updateShopsList()
    // Close sidebar search results when a shop is selected
    if (domCache.sidebarSearchResultsList) {
        domCache.sidebarSearchResultsList.classList.remove("active")
        domCache.sidebarSearchInput.value = "" // Clear search input
        filterShops("") // Reset filter, which will also show main content
    }
}

function formatDateRussian(dateString) {
    if (!dateString) return "Дата не указана"

    const months = [
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря",
    ]

    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "Неверная дата"

        const day = date.getDate()
        const month = months[date.getMonth()]
        const year = date.getFullYear()
        return `${day} ${month} ${year} г.`
    } catch (error) {
        console.error("Error formatting date:", error)
        return "Ошибка даты"
    }
}

// Map update function
function updateMap() {
    if (!map) return

    // Clear existing placemarks (except user location)
    placemarks.forEach((placemark) => {
        map.geoObjects.remove(placemark)
    })
    placemarks.length = 0

    // Group shops by proximity
    const groups = []
    allShops.forEach((shop) => {
        if (!shop.latitude || !shop.longitude) return

        const group = groups.find((g) => getDistance(g[0].latitude, g[0].longitude, shop.latitude, shop.longitude) <= 50)
        if (group) {
            group.push(shop)
        } else {
            groups.push([shop])
        }
    })

    groups.forEach((group) => {
        const lat = group[0].latitude
        const lon = group[0].longitude

        // Create balloon content
        const storeCardsHtml = group
            .map((shop) => {
                const statusInfo = getStatusInfo(shop.originalStatus)
                const yandexGoUrl = `https://3.redirect.appmetrica.yandex.com/route?end-lat=${shop.latitude}&end-lon=${shop.longitude}&appmetrica_tracking_id=1178268795219780156`

                let distanceText = ""
                if (userLocation) {
                    const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
                    if (distance < 1000) {
                        distanceText = `<div style="font-size: 11px; color: #059669; margin-top: 4px;">📍 ${Math.round(distance)} м от вас</div>`
                    } else {
                        distanceText = `<div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
                    }
                }

                let photoHtml = ""
                if (shop.photoUrl) {
                    photoHtml = `
          <div class="market-photo-container" style="margin-bottom: 12px;">
            <img src="${shop.photoUrl}" alt="Фото ${shop.name}" class="market-photo" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" onerror="this.parentElement.innerHTML='<div style=\\"padding: 20px; text-align: center; color: #6b7280; border: 2px dashed #d1d5db; border-radius: 8px;\\">
          </div>
        `
                } else {
                    photoHtml = `
          <div style="padding: 20px; text-align: center; color: #6b7280; border: 2px dashed #d1d5db; border-radius: 8px; margin-bottom: 12px;">
            📷 Фото отсутствует
          </div>
        `
                }

                return `
        <div class="store-card">
          ${photoHtml}
          <div class="store-header">
            <div class="store-name">${shop.name}</div>
          </div>
          <div class="store-details">
            <div class="detail-row">
              <div class="detail-icon-wrapper agent">
                <span class="detail-icon">👤</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Агент</span>
                <span class="detail-value">${shop.agent}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-icon-wrapper phone">
                <span class="detail-icon">📞</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Телефон</span>
                <span class="detail-value">
                  <a href="tel:${shop.phone}" style="color: #2563eb; text-decoration: none;">
                    ${shop.phone}
                  </a>
                </span>
              </div>
            </div>
            ${shop.clientId
                        ? `
                <div class="detail-row">
                  <div class="detail-icon-wrapper client">
                    <span class="detail-icon">🆔</span>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">ID Клиента</span>
                    <span class="detail-value">${shop.clientId}</span>
                  </div>
                </div>
              `
                        : ""
                    }
            <div class="detail-row">
              <div class="detail-icon-wrapper money">
                <span class="detail-icon">💰</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Общая сумма</span>
                <span class="detail-value">$${shop.totalUsd.toFixed(2)}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-icon-wrapper date">
                <span class="detail-icon">📅</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Добавлено</span>
                <span class="detail-value">${formatDateRussian(shop.createdAt)}</span>
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-icon-wrapper date">
                <span class="detail-icon">🗓️</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Последний визит</span>
                <span class="detail-value">${formatDateRussian(shop.lastVisit)}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-icon-wrapper status">
                <span class="detail-icon">${statusInfo.icon}</span>
              </div>
              <div class="detail-content">
                <span class="detail-label">Статус</span>
                <span class="detail-value">
                  <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                </span>
              </div>
            </div>
            ${shop.notes
                        ? `
                <div class="detail-row">
                  <div class="detail-icon-wrapper notes">
                    <span class="detail-icon">📝</span>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">Заметки</span>
                    <div class="notes-edit-container" data-shop-id="${shop.id}">
                      <div class="notes-display">
                        <span class="detail-value notes-text">${shop.notes}</span>
                      </div>
                      <div class="notes-edit-form">
                        <textarea class="notes-textarea" placeholder="Введите заметки...">${shop.notes}</textarea>
                        <div class="notes-edit-actions">
                          <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
                          <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `
                        : `
                <div class="detail-row">
                  <div class="detail-icon-wrapper notes">
                    <span class="detail-icon">📝</span>
                  </div>
                  <div class="detail-content">
                    <span class="detail-label">Заметки</span>
                    <div class="notes-edit-container" data-shop-id="${shop.id}">
                      <div class="notes-display">
                        <span class="detail-value notes-text">Нет заметок</span>
                        <button class="edit-notes-btn" onclick="startEditingNotes('${shop.id}')" title="Добавить заметки">
                          ✏️
                        </button>
                      </div>
                      <div class="notes-edit-form">
                        <textarea class="notes-textarea" placeholder="Введите заметки..."></textarea>
                        <div class="notes-edit-actions">
                          <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
                          <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `
                    }
            <a href="${yandexGoUrl}" target="_blank" class="route-button">
              🚗 Построить маршрут
            </a>
            <button class="visited-button" onclick="markVisited('${shop.id}')">
              ✅ Отметить как посещённый
            </button>
          </div>
        </div>
      `
            })
            .join("")

        const content = `
          <div class="modern-balloon">
              <div class="balloon-header">
                  <h3 class="balloon-main-title">
                      ${group.length > 1 ? `Группа магазинов` : "Партнерский магазин"}
                  </h3>
                  ${group.length > 1 ? `<p class="balloon-subtitle">${group.length} магазинов в этой области</p>` : ""}
              </div>
              <div class="balloon-content">
                  ${storeCardsHtml}
              </div>
          </div>
      `

        let iconColor
        if (group.length === 1) {
            const shop = group[0]
            console.log(`Shop: ${shop.name}, lastVisit: ${shop.lastVisit}`) // Log lastVisit
            if (shop.lastVisit === null || shop.lastVisit === undefined || shop.lastVisit === "") {
                iconColor = "#ef4444" // Red for "never visited" or invalid date string
                console.log(`  -> Color: Red (never visited or invalid date string)`)
            } else {
                const visitedDate = new Date(shop.lastVisit)
                if (isNaN(visitedDate.getTime())) {
                    iconColor = "#ef4444" // Red for invalid date format
                    console.log(`  -> Color: Red (invalid date format for lastVisit: ${shop.lastVisit})`)
                } else {
                    const diffInDays = (Date.now() - visitedDate.getTime()) / (1000 * 60 * 60 * 24)
                    console.log(`  -> diffInDays: ${diffInDays}`)
                    if (diffInDays <= 7) {
                        // Green if visited within the last 7 days
                        iconColor = "#10b981"
                        console.log(`  -> Color: Green (visited within 7 days)`)
                    } else if (diffInDays <= 15) {
                        // Yellow if visited 7-15 days ago
                        iconColor = "#fbbf24"
                        console.log(`  -> Color: Yellow (visited 7-15 days ago)`)
                    } else {
                        // Red if visited more than 15 days ago
                        iconColor = "#ef4444"
                        console.log(`  -> Color: Red (visited more than 15 days ago)`)
                    }
                }
            }
        } else {
            iconColor = "#3b82f6" // Keep group color as blue
            console.log(`  -> Color: Blue (group)`)
        }

        const iconSize = group.length > 1 ? [36, 36] : [28, 28]
        const iconOffset = group.length > 1 ? [-18, -36] : [-14, -28]
        const displayText = group.length > 1 ? group.length.toString() : "М"

        const placemark = new ymaps.Placemark(
            [lat, lon],
            {
                balloonContent: content,
                hintContent: group.length > 1 ? `Группа из ${group.length} магазинов` : group[0].name,
                shopId: group[0].id, // Store the shop ID on the placemark properties (as a number)
            },
            {
                iconLayout: "default#image",
                iconImageHref: createCustomIcon(iconColor, iconSize, displayText),
                iconImageSize: iconSize,
                iconImageOffset: iconOffset,
                hideIconOnBalloonOpen: false,
                balloonAutoPan: true,
                balloonOffset: [0, -10],
            },
        )

        placemark.events.add("click", (e) => {
            e.stopPropagation()
            const coords = placemark.geometry.getCoordinates()
            map
                .setCenter(coords, Math.max(map.getZoom(), 15), {
                    duration: 400,
                    timingFunction: "ease-out",
                })
                .then(() => {
                    placemark.balloon.open()
                })
        })

        map.geoObjects.add(placemark)
        placemarks.push(placemark)
    })
}

// Map initialization
function initMap() {
    ymaps.ready(() => {
        map = new ymaps.Map(
            "map",
            {
                center: [41.31, 69.28],
                zoom: 11,
                controls: ["zoomControl", "fullscreenControl", "typeSelector"],
                suppressMapOpenBlock: true,
                yandexMapDisablePoiInteractivity: true,
            },
            {
                suppressMapOpenBlock: true,
                avoidFractionalZoom: false,
                restrictMapArea: false,
            },
        )

        // Add location button
        const locationButton = new ymaps.control.Button({
            data: {
                content: "📍",
                title: "Показать мое местоположение",
            },
            options: {
                selectOnClick: false,
                maxWidth: 40,
            },
        })

        locationButton.events.add("click", () => {
            if (userLocation) {
                centerOnUserLocation()
            } else {
                getUserLocation()
            }
        })

        map.controls.add(locationButton, {
            position: { right: 10, top: 170 },
        })

        map.controls.get("zoomControl").options.set({
            size: "large",
            position: { right: 10, top: 50 },
            adjustMapMargin: false,
        })

        map.controls.get("fullscreenControl").options.set({
            position: { right: 10, top: 110 },
            adjustMapMargin: false,
        })

        map.events.add("click", (e) => {
            map.balloon.close()
        })

        // Load initial data
        loadShopData()

        // Start auto-update
        startAutoUpdate()

        // Get user location automatically
        setTimeout(() => {
            getUserLocation()
            startWatchingLocation()
        }, 1000)
    })
}

// Auto-update functions
function startAutoUpdate() {
    updateInterval = setInterval(() => {
        loadShopData(true)
    }, AUTO_UPDATE_INTERVAL)
}

function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval)
        updateInterval = null
    }
}

// Popup functions
function truncateText(text, maxLength = 120) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
}

function toggleDescription(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    if (expandedDescriptions.has(numericShopId)) {
        expandedDescriptions.delete(numericShopId)
    } else {
        expandedDescriptions.add(numericShopId)
    }
    renderShops()
}

function createShopCard(shop) {
    const isExpanded = expandedDescriptions.has(shop.id)
    const description = isExpanded ? shop.description : truncateText(shop.description)
    const needsExpansion = shop.description && shop.description.length > 120

    let distanceText = ""
    if (userLocation && shop.latitude && shop.longitude) {
        const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
        if (distance < 1000) {
            distanceText = `<div style="font-size: 0.75rem; color: #059669; margin-top: 0.25rem;">📍 ${Math.round(distance)} м от вас</div>`
        } else {
            distanceText = `<div style="font-size: 0.75rem; color: #3b82f6; margin-top: 0.25rem;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
        }
    }

    const isShopIdValid = shop.id && shop.id !== 0

   
    return `
    <div class="shop-card" data-shop-id="${shop.id}">
      <div class="shop-header">
        <h3 class="shop-name">${shop.name}</h3>
        <span class="status-badge ${shop.status}">${getStatusText(shop.status)}</span>
      </div>
      
      <div class="shop-details">
        <div class="detail-row">
          <div class="detail-icon address">📍</div>
          <div class="detail-content">
            <div class="detail-label">Адрес клиента</div>
            <div class="detail-value">${shop.address}${distanceText}</div>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-icon agent">👤</div>
          <div class="detail-content">
            <div class="detail-label">Агент</div>
            <div class="detail-value">${shop.agent}</div>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-icon phone">📞</div>
          <div class="detail-content">
            <div class="detail-label">Телефон</div>
            <div class="detail-value">
              <a href="tel:${shop.phone}" class="phone-link">${shop.phone}</a>
            </div>
          </div>
        </div>
        
        ${shop.clientId
            ? `
            <div class="detail-row">
              <div class="detail-icon client">🆔</div>
              <div class="detail-content">
                <div class="detail-label">ID Клиента</div>
                <div class="detail-value">${shop.clientId}</div>
              </div>
            </div>
        `
            : ""
        }
        
        <div class="detail-row">
          <div class="detail-icon money">💰</div>
          <div class="detail-content">
            <div class="detail-label">Общая сумма</div>
            <div class="detail-value">$${shop.totalUsd.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-icon notes">📝</div>
          <div class="detail-content">
            <div class="detail-label">Заметки</div>
            <div class="notes-edit-container" data-shop-id="${shop.id}">
              <div class="notes-display">
                <div class="detail-value notes-text">${shop.notes || "Нет заметок"}</div>
                <button class="edit-notes-btn" onclick="startEditingNotes('${shop.id}')" title="Редактировать заметки">
                  ✏️
                </button>
              </div>
              <div class="notes-edit-form">
                <textarea class="notes-textarea" placeholder="Введите заметки...">${shop.notes || ""}</textarea>
                <div class="notes-edit-actions">
                  <button class="notes-save-btn" onclick="saveNotesEdit('${shop.id}')">Сохранить</button>
                  <button class="notes-cancel-btn" onclick="cancelEditingNotes('${shop.id}')">Отмена</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-icon date">📅</div>
          <div class="detail-content">
            <div class="detail-label">Добавлено</div>
            <div class="detail-value">${formatDateRussian(shop.createdAt)}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon date">🗓️</div>
          <div class="detail-content">
            <div class="detail-label">Последний визит</div>
            <div class="detail-value">${formatDateRussian(shop.lastVisit)}</div>
          </div>
        </div>
      </div>
      
      <button class="view-details-btn" onclick="viewShopDetails('${shop.id}')">
        Показать на карте
      </button>
      
      <button class="visited-button" ${isShopIdValid ? `onclick="markVisited('${shop.id}')"` : "disabled"} title="${isShopIdValid ? "Отметить как посещённый" : "ID магазина отсутствует"}">
        ✅ Отметить как посещённый
      </button>
    </div>
  `
}

function openPhotoModal(photoUrl, shopName) {
    const photoModalOverlay = document.getElementById("photoModalOverlay")
    const photoModalTitle = document.getElementById("photoModalTitle")
    const photoModalImage = document.getElementById("photoModalImage")

    if (photoModalOverlay && photoModalTitle && photoModalImage) {
        photoModalTitle.textContent = `Фото магазина: ${shopName}`
        photoModalImage.src = photoUrl
        photoModalImage.alt = `Фото ${shopName}`
        photoModalOverlay.classList.add("active")

        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden"
    }
}

function closePhotoModal() {
    const photoModalOverlay = document.getElementById("photoModalOverlay")

    if (photoModalOverlay) {
        photoModalOverlay.classList.remove("active")

        // Restore body scroll
        document.body.style.overflow = ""
    }
}

// Close photo modal on Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closePhotoModal()
    }
})

// New: Render search results in the sidebar search panel
function renderSidebarSearchResults() {
    if (!domCache.sidebarSearchResultsList) return

    if (searchTerm === "") {
        domCache.sidebarSearchResultsList.innerHTML = ""
        domCache.sidebarSearchResultsList.classList.remove("active")
        return
    }

    if (filteredShops.length === 0) {
        domCache.sidebarSearchResultsList.innerHTML = '<div class="sidebar-search-no-results">Нет результатов.</div>'
        domCache.sidebarSearchResultsList.classList.add("active")
        return
    }

    const html = filteredShops
        .map(
            (shop) => `
          <div class="sidebar-search-item" onclick="viewShopDetails('${shop.id}')">
              <div class="sidebar-search-item-name">${shop.name}</div>
              <div class="sidebar-search-item-details">Агент: ${shop.agent} | Телефон: ${shop.phone}</div>
          </div>
      `,
        )
        .join("")

    domCache.sidebarSearchResultsList.innerHTML = html
    domCache.sidebarSearchResultsList.classList.add("active")
}

function renderShops() {
    if (!domCache.shopsGrid) return

    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentShops = filteredShops.slice(startIndex, endIndex) // Use filteredShops

    const html = currentShops.map((shop) => createShopCard(shop)).join("")
    domCache.shopsGrid.innerHTML = html

    updatePagination()
}

function updatePagination() {
    if (!domCache.paginationInfo || !domCache.pagination || !domCache.paginationControls) return

    const totalPages = Math.ceil(filteredShops.length / itemsPerPage) // Use filteredShops.length
    const startIndex = currentPage * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, filteredShops.length) // Use filteredShops.length

    domCache.paginationInfo.textContent = `Показано с ${startIndex + 1} по ${endIndex} из ${filteredShops.length} магазинов` // Use filteredShops.length
    domCache.pagination.style.display = totalPages > 1 ? "flex" : "none"

    if (totalPages <= 1) return

    let html = ""
    html += `<button class="pagination-btn" ${currentPage === 0 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">‹</button>`

    const maxVisiblePages = 5
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i + 1}</button>`
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += '<div class="pagination-ellipsis">...</div>'
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`
    }

    html += `<button class="pagination-btn" ${currentPage === totalPages - 1 ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">›</button>`

    domCache.paginationControls.innerHTML = html
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredShops.length / itemsPerPage) // Use filteredShops.length
    if (page >= 0 && page < totalPages) {
        currentPage = page
        renderShops()

        const popupContent = domCache.popupOverlay?.querySelector(".popup-content")
        if (popupContent) {
            popupContent.scrollTop = 0
        }
    }
}

function openPopup() {
    // Ensure filteredShops is correctly set to allShops if no search is active
    if (searchTerm === "") {
        filteredShops = allShops
    }

    if (filteredShops.length === 0) {
        return
    }

    currentPage = 0
    expandedDescriptions.clear()
    renderShops()

    if (domCache.popupOverlay) {
        domCache.popupOverlay.classList.add("active")
        document.body.style.overflow = "hidden"

        setTimeout(() => {
            const popupContent = domCache.popupOverlay.querySelector(".popup-content")
            if (popupContent) {
                popupContent.scrollTop = 0
            }
        }, 100)
    }
}

function closePopup() {
    if (domCache.popupOverlay) {
        domCache.popupOverlay.classList.remove("active")
        document.body.style.overflow = "unset"
    }
}

function closePopupOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closePopup()
    }
}

function viewShopDetails(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    const shop = allShops.find((s) => s.id === numericShopId) // Use numericShopId for lookup
    if (shop && map) {
        closePopup()
        closePanel()
        selectShop(numericShopId) // Pass the numeric ID to selectShop
    }
}

// FIXED: Mark as visited function
async function markVisited(shopId) {
    // Ensure shopId is a number for lookup
    const numericShopId = Number(shopId)
    try {
        if (!numericShopId || numericShopId === 0) {
            showLocationNotification("Недостаточно данных для отметки посещения (ID магазина отсутствует)", "error")
            return
        }

        // Prepare the data to send
        const visitData = {
            id: numericShopId,
            visitedAt: new Date().toISOString(),
        }

        console.log("Отправка данных о посещении:", visitData)

        const response = await fetch("/mark-visited", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(visitData),
        })

        if (response.ok) {
            const result = await response.text()
            console.log("Ответ сервера:", result)

            // Update local data for the specific shop
            const shopToUpdate = allShops.find((s) => s.id === numericShopId)
            if (shopToUpdate) {
                shopToUpdate.lastVisit = visitData.visitedAt
            }

            // Update UI
            updateMap()
            if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
                renderShops()
            }

            showLocationNotification("✅ Магазин отмечен как посещённый!", "success")

            // Reload data to get fresh information
            setTimeout(() => {
                loadShopData(false)
            }, 1000)
        } else {
            const errorText = await response.text()
            console.error("Ошибка сервера:", response.status, errorText)
            showLocationNotification(`❌ Ошибка сервера: ${response.status}`, "error")
        }
    } catch (error) {
        console.error("Ошибка при отметке посещения:", error)
        showLocationNotification("⚠️ Ошибка при запросе к серверу", "error")
    }
}

// Event handlers
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (domCache.popupOverlay && domCache.popupOverlay.classList.contains("active")) {
            closePopup()
        } else if (isPanelOpen) {
            closePanel()
        } else if (
            domCache.sidebarSearchResultsList &&
            domCache.sidebarSearchInput &&
            domCache.sidebarSearchResultsList.classList.contains("active")
        ) {
            domCache.sidebarSearchResultsList.classList.remove("active")
            domCache.sidebarSearchInput.value = "" // Clear search input
            filterShops("") // Reset filter, which will also show main content
        }
    }
})

// Application initialization
document.addEventListener("DOMContentLoaded", () => {
    console.log("Инициализация приложения...")
    initDOMCache()
    initMap()

    // New: Add event listener for sidebar search input
    if (domCache.sidebarSearchInput) {
        domCache.sidebarSearchInput.addEventListener(
            "input",
            debounce((event) => {
                filterShops(event.target.value)
            }, 300),
        )
        // New: Add event listener to hide search results when clicking outside
        document.addEventListener("click", (event) => {
            if (
                domCache.sidebarSearchResultsList &&
                domCache.sidebarSearchInput &&
                !domCache.sidebarSearchResultsList.contains(event.target) &&
                !domCache.sidebarSearchInput.contains(event.target)
            ) {
                domCache.sidebarSearchResultsList.classList.remove("active")
            }
        })
    }
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
    stopAutoUpdate()
    stopWatchingLocation()
    iconCache.clear()
    Object.keys(domCache).forEach((key) => delete domCache[key])
})

// Make functions globally available
window.togglePanel = togglePanel
window.openPanel = openPanel
window.closePanel = closePanel
window.getUserLocation = getUserLocation
window.centerOnUserLocation = centerOnUserLocation
window.selectShop = selectShop
window.startEditingNotes = startEditingNotes
window.cancelEditingNotes = cancelEditingNotes
window.saveNotesEdit = saveNotesEdit
window.loadShopData = loadShopData
window.toggleDescription = toggleDescription
window.renderShops = renderShops
window.goToPage = goToPage
window.openPopup = openPopup
window.closePopup = closePopup
window.closePopupOnOverlay = closePopupOnOverlay
window.viewShopDetails = viewShopDetails
window.markVisited = markVisited
