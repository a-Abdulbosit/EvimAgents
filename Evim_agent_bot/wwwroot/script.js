// Глобальные переменные
let allShops = []
let currentPage = 0
const itemsPerPage = 6
const expandedDescriptions = new Set()
let selectedShopId = null
let map = null
const placemarks = []
let isPanelOpen = false
let lastDataHash = null
let userLocationMarker = null
let userLocation = null
let watchId = null

// Интервал автообновления (1 секунда)
const AUTO_UPDATE_INTERVAL = 1000
let updateInterval = null

// Кэш для DOM элементов
const domCache = {}

// Инициализация кэша DOM элементов
function initDOMCache() {
    domCache.sidebarSubtitle = document.getElementById("sidebarSubtitle")
    domCache.activeCount = document.getElementById("activeCount")
    domCache.pendingCount = document.getElementById("pendingCount")
    domCache.inactiveCount = document.getElementById("inactiveCount")
    domCache.popupSubtitle = document.getElementById("popupSubtitle")
    domCache.sidebarLoading = document.getElementById("sidebarLoading")
    domCache.sidebarContent = document.getElementById("sidebarContent")
    domCache.shopsList = document.getElementById("shopsList")
    domCache.shopsGrid = document.getElementById("shopsGrid")
    domCache.paginationInfo = document.getElementById("paginationInfo")
    domCache.paginationControls = document.getElementById("paginationControls")
    domCache.pagination = document.getElementById("pagination")
    domCache.updateNotification = document.getElementById("updateNotification")
    domCache.popupOverlay = document.getElementById("popupOverlay")
    domCache.sidebar = document.getElementById("sidebar")
    domCache.panelToggle = document.getElementById("panelToggle")
}

// Дебаунсинг для оптимизации производительности
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

// Троттлинг для ограничения частоты вызовов
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

// Генерация хэша для сравнения данных (оптимизированная)
function generateDataHash(data) {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Преобразование в 32-битное целое число
    }
    return hash
}

// Показать уведомление об обновлении
function showUpdateNotification() {
    domCache.updateNotification.classList.add("show")
    setTimeout(() => {
        domCache.updateNotification.classList.remove("show")
    }, 2000)
}

// Показать уведомление о местоположении
function showLocationNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#3b82f6"};
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

    // Показать уведомление
    setTimeout(() => {
        notification.style.transform = "translateX(0)"
    }, 100)

    // Скрыть уведомление через 4 секунды
    setTimeout(() => {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => {
            document.body.removeChild(notification)
        }, 300)
    }, 4000)
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
    domCache.sidebarLoading.style.display = "none"
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

// Функции переключения панели
function togglePanel() {
    if (isPanelOpen) {
        closePanel()
    } else {
        openPanel()
    }
}

function openPanel() {
    domCache.sidebar.classList.add("open")
    domCache.panelToggle.classList.add("panel-open")
    domCache.panelToggle.innerHTML = "📊"
    isPanelOpen = true
}

function closePanel() {
    domCache.sidebar.classList.remove("open")
    domCache.panelToggle.classList.remove("panel-open")
    domCache.panelToggle.innerHTML = "📊"
    isPanelOpen = false
}

// GPS и геолокация
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
        maximumAge: 60000, // Кэш на 1 минуту
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

    // Удалить предыдущий маркер местоположения
    if (userLocationMarker) {
        map.geoObjects.remove(userLocationMarker)
    }

    // Создать новый маркер местоположения
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

// Утилитарные функции
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

// Кэш для SVG иконок
const iconCache = new Map()

function createCustomIcon(iconColor, iconSize, displayText) {
    const cacheKey = `${iconColor}-${iconSize[0]}-${iconSize[1]}-${displayText}`

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)
    }

    const radius = iconSize[0] / 2 - 3
    const cx = iconSize[0] / 2
    const cy = iconSize[1] / 2

    const svgContent = `
    <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 ${iconSize[0]} ${iconSize[1]}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${Math.random().toString(36).substr(2, 9)}" x="-50%" y="-50%" width="200%" height="200%">
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

// Функции преобразования данных
function convertLocationDataToShops(locations) {
    return locations.map((location, index) => ({
        id: `shop-${index + 1}`,
        name: location.marketName,
        address:
            location.latitude != null && location.longitude != null
                ? `Координаты: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                : "Координаты отсутствуют",
        description: location.notes || `${location.marketName} - Партнерская торговая точка`,
        agent: location.agentName,
        phone: location.marketNumber,
        createdAt: location.createdAt,
        status: location.status === 1 ? "active" : location.status === 0 ? "pending" : "inactive",
        notes: location.notes,
        latitude: location.latitude,
        longitude: location.longitude,
        originalStatus: location.status,
        clientId: location.clientId || null,
        totalUsd: location.totalUsd || 0,
        telegramUserId: location.telegramUserId,
    }))
}

// Загрузка данных магазинов с автоматическими обновлениями (оптимизированная)
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
        const newDataHash = generateDataHash(locations)

        // Проверка изменения данных
        const dataChanged = lastDataHash !== null && lastDataHash !== newDataHash

        if (dataChanged || allShops.length === 0) {
            allShops = convertLocationDataToShops(locations)
            lastDataHash = newDataHash

            updateUI()
            updateMap()

            // Обновление всплывающего окна, если оно открыто
            if (domCache.popupOverlay.classList.contains("active")) {
                renderShops()
            }

            // Показать уведомление для изменений данных (не для начальной загрузки)
            if (showNotification && dataChanged) {
                showUpdateNotification()
            }

            console.log(`${dataChanged ? "Обновлено" : "Загружено"} ${allShops.length} магазинов из locations.json`)
        }
    } catch (error) {
        console.error("Ошибка загрузки локаций:", error)

        // Показать сообщение об ошибке в UI
        if (allShops.length === 0) {
            showErrorMessage("Не удалось загрузить данные магазинов. Проверьте наличие файла locations.json")
        }
    }
}

// Обновление UI с данными магазинов (оптимизированное)
function updateUI() {
    const shopCount = allShops.length
    const activeCount = allShops.filter((s) => s.status === "active").length
    const pendingCount = allShops.filter((s) => s.status === "pending").length
    const inactiveCount = allShops.filter((s) => s.status === "inactive").length

    // Обновление боковой панели
    domCache.sidebarSubtitle.textContent = `${shopCount} магазинов в сети`
    domCache.activeCount.textContent = activeCount
    domCache.pendingCount.textContent = pendingCount
    domCache.inactiveCount.textContent = inactiveCount
    domCache.popupSubtitle.textContent = `Найдено ${shopCount} магазинов`

    // Показать контент, скрыть загрузку
    domCache.sidebarLoading.style.display = "none"
    domCache.sidebarContent.style.display = "block"

    // Обновить список магазинов
    updateShopsList()
}

// Получить текст статуса
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

// Обновление списка магазинов в боковой панели (оптимизированное)
function updateShopsList() {
    const displayShops = allShops.slice(0, 8) // Показать первые 8 магазинов в боковой панели

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

// Выбрать магазин и центрировать карту
function selectShop(shopId) {
    selectedShopId = shopId
    const shop = allShops.find((s) => s.id === shopId)

    if (shop && map) {
        // Center the map and zoom to the selected shop
        map
            .setCenter([shop.latitude, shop.longitude], 16, {
                duration: 600,
                timingFunction: "ease-out",
            })
            .then(() => {
                // Find and open the balloon for this shop after centering
                const targetPlacemark = placemarks.find((placemark) => {
                    const coords = placemark.geometry.getCoordinates()
                    return Math.abs(coords[0] - shop.latitude) < 0.001 && Math.abs(coords[1] - shop.longitude) < 0.001
                })
                if (targetPlacemark) {
                    targetPlacemark.balloon.open()
                }
            })
    }

    updateShopsList()
}

// Форматирование даты на русском языке
function formatDateRussian(dateString) {
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

    const date = new Date(dateString)
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year} г.`
}

// Обновление карты (оптимизированное)
function updateMap() {
    if (!map) return

    // Очистка существующих меток (кроме пользовательской)
    placemarks.forEach((placemark) => {
        map.geoObjects.remove(placemark)
    })
    placemarks.length = 0 // Более быстрая очистка массива

    // Группировка магазинов по близости
    const groups = []
    allShops.forEach((shop) => {
        const group = groups.find((g) => getDistance(g[0].latitude, g[0].longitude, shop.latitude, shop.longitude) <= 50)
        if (group) group.push(shop)
        else groups.push([shop])
    })

    groups.forEach((group) => {
        const lat = group[0].latitude
        const lon = group[0].longitude

        // Создание содержимого всплывающего окна
        const storeCardsHtml = group
            .map((shop) => {
                const statusInfo = getStatusInfo(shop.originalStatus)
                const yandexGoUrl = `https://3.redirect.appmetrica.yandex.com/route?end-lat=${shop.latitude}&end-lon=${shop.longitude}&appmetrica_tracking_id=1178268795219780156`

                // Рассчитать расстояние до пользователя, если местоположение известно
                let distanceText = ""
                if (userLocation) {
                    const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
                    if (distance < 1000) {
                        distanceText = `<div style="font-size: 11px; color: #059669; margin-top: 4px;">📍 ${Math.round(distance)} м от вас</div>`
                    } else {
                        distanceText = `<div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
                    }
                }

                return `
          <div class="store-card">
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
                  <span class="detail-value">${formatDateRussian(shop.createdAt)}${distanceText}</span>
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
                    <span class="detail-value">${shop.notes}</span>
                  </div>
                </div>
              `
                        : ""
                    }
              <a href="${yandexGoUrl}" target="_blank" class="route-button">
                🚗 Построить маршрут
              </a>
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

        const getIconColor = (status) => {
            switch (status) {
                case 0:
                    return "#f59e0b" // в ожидании - желтый
                case 1:
                    return "#059669" // активный - зеленый
                case 2:
                    return "#dc2626" // неактивный - красный
                default:
                    return "#6b7280" // неизвестно - серый
            }
        }

        const iconColor = group.length === 1 ? getIconColor(group[0].originalStatus) : "#3b82f6"
        const iconSize = group.length > 1 ? [36, 36] : [28, 28]
        const iconOffset = group.length > 1 ? [-18, -36] : [-14, -28]
        const displayText = group.length > 1 ? group.length.toString() : "М"

        const placemark = new ymaps.Placemark(
            [lat, lon],
            {
                balloonContent: content,
                hintContent: group.length > 1 ? `Группа из ${group.length} магазинов` : group[0].name,
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

// Инициализация карты
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

        // Добавить кнопку геолокации
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

        // Загрузка начальных данных
        loadShopData()

        // Запуск автообновления
        startAutoUpdate()

        // Автоматически получить местоположение пользователя при загрузке
        setTimeout(() => {
            getUserLocation()
            startWatchingLocation()
        }, 1000)
    })
}

// Запуск автоматических обновлений
function startAutoUpdate() {
    updateInterval = setInterval(() => {
        loadShopData(true)
    }, AUTO_UPDATE_INTERVAL)
}

// Остановка автоматических обновлений
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval)
        updateInterval = null
    }
}

// Функции всплывающего окна
function truncateText(text, maxLength = 120) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
}

function toggleDescription(shopId) {
    if (expandedDescriptions.has(shopId)) {
        expandedDescriptions.delete(shopId)
    } else {
        expandedDescriptions.add(shopId)
    }
    renderShops()
}

function createShopCard(shop) {
    const isExpanded = expandedDescriptions.has(shop.id)
    const description = isExpanded ? shop.description : truncateText(shop.description)
    const needsExpansion = shop.description.length > 120

    // Рассчитать расстояние до пользователя, если местоположение известно
    let distanceText = ""
    if (userLocation) {
        const distance = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
        if (distance < 1000) {
            distanceText = `<div style="font-size: 0.75rem; color: #059669; margin-top: 0.25rem;">📍 ${Math.round(distance)} м от вас</div>`
        } else {
            distanceText = `<div style="font-size: 0.75rem; color: #3b82f6; margin-top: 0.25rem;">📍 ${(distance / 1000).toFixed(1)} км от вас</div>`
        }
    }

    return `
    <div class="shop-card">
      <div class="shop-header">
        <h3 class="shop-name">${shop.name}</h3>
        <span class="status-badge ${shop.status}">${getStatusText(shop.status)}</span>
      </div>
      
      <div class="shop-details">
        <div class="detail-row">
          <div class="detail-icon address">📍</div>
          <div class="detail-content">
            <div class="detail-label">Адрес</div>
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
            <div class="detail-label">Описание</div>
            <div class="detail-value description-text">
              ${description}
              ${needsExpansion
            ? `
                  <button class="expand-btn" onclick="toggleDescription('${shop.id}')">
                    ${isExpanded ? "Показать меньше" : "Показать больше"}
                  </button>
                `
            : ""
        }
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
        
        ${shop.notes && shop.notes !== shop.description
            ? `
            <div class="notes-section">
              <div class="detail-label">Заметки</div>
              <div class="detail-value description-text">${shop.notes}</div>
            </div>
          `
            : ""
        }
      </div>
      
      <button class="view-details-btn" onclick="viewShopDetails('${shop.id}')">
        Показать на карте
      </button>
    </div>
  `
}

// Рендеринг магазинов (оптимизированный)
function renderShops() {
    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentShops = allShops.slice(startIndex, endIndex)

    const html = currentShops.map((shop) => createShopCard(shop)).join("")
    domCache.shopsGrid.innerHTML = html

    updatePagination()
}

function updatePagination() {
    const totalPages = Math.ceil(allShops.length / itemsPerPage)
    const startIndex = currentPage * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, allShops.length)

    domCache.paginationInfo.textContent = `Показано с ${startIndex + 1} по ${endIndex} из ${allShops.length} магазинов`

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
    const totalPages = Math.ceil(allShops.length / itemsPerPage)
    if (page >= 0 && page < totalPages) {
        currentPage = page
        renderShops()

        // Прокрутка к верху содержимого всплывающего окна при смене страниц
        const popupContent = domCache.popupOverlay.querySelector(".popup-content")
        if (popupContent) {
            popupContent.scrollTop = 0
        }
    }
}

function openPopup() {
    if (allShops.length === 0) return

    currentPage = 0
    expandedDescriptions.clear()
    renderShops()

    domCache.popupOverlay.classList.add("active")
    document.body.style.overflow = "hidden"

    // Убедиться, что содержимое всплывающего окна начинается сверху
    setTimeout(() => {
        const popupContent = domCache.popupOverlay.querySelector(".popup-content")
        if (popupContent) {
            popupContent.scrollTop = 0
        }
    }, 100)
}

function closePopup() {
    domCache.popupOverlay.classList.remove("active")
    document.body.style.overflow = "unset"
}

function closePopupOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closePopup()
    }
}

function viewShopDetails(shopId) {
    const shop = allShops.find((s) => s.id === shopId)
    if (shop && map) {
        closePopup()
        closePanel() // Close the left sidebar automatically
        selectShop(shopId)
        // Remove the condition that opens panel - we want it closed
    }
}

// Обработчики событий клавиатуры
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (domCache.popupOverlay.classList.contains("active")) {
            closePopup()
        } else if (isPanelOpen) {
            closePanel()
        }
    }
})

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
    initDOMCache()
    initMap()
})

// Очистка при выгрузке страницы
window.addEventListener("beforeunload", () => {
    stopAutoUpdate()
    stopWatchingLocation()
    // Очистка кэшей
    iconCache.clear()
    Object.keys(domCache).forEach((key) => delete domCache[key])
})
