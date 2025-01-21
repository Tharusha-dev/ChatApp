(() => {
    
    const script = document.currentScript;

    const loadWidget = () => {
        
        const widget= document.createElement("div");

        const websiteId = script.getAttribute("website-id");
        const iconUrl = script.getAttribute("icon-url");
        const currentPageUrl = encodeURIComponent(window.location.href);
    
        const widgetStyle = widget.style;
        widgetStyle.display = "none";
        widgetStyle.boxSizing = "border-box";
        widgetStyle.width = "85%";
        widgetStyle.maxWidth = "400px";
        widgetStyle.height = "50vh";
        // widgetStyle.bottom = "100px";
        widgetStyle.maxHeight = "647px";
        widgetStyle.position = "fixed";
        widgetStyle.bottom = "9%";
        widgetStyle.right = "20px";
        widgetStyle.zIndex = "999998";
        widgetStyle.transition = "all 0.3s ease-in-out";
        widgetStyle.opacity = "0";
        widgetStyle.transform = "translateY(20px)";

        const iframe = document.createElement("iframe");
        
        const iframeStyle = iframe.style;
        iframeStyle.boxSizing = "border-box";
        iframeStyle.position = "absolute";
        iframeStyle.right = 0;
        iframeStyle.top = 0;
        iframeStyle.width = "100%";
        iframeStyle.height = "100%";
        iframeStyle.border = "1px solid hsl(240, 5.9%, 90%)";
        iframeStyle.borderRadius = "12px";
        iframeStyle.boxShadow = "0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)";
        iframeStyle.margin = 0;
        iframeStyle.padding = 0;

        widget.appendChild(iframe);
        
        iframe.addEventListener("load", () => {
            widget.style.display = "block";
            setTimeout(() => {
                widget.style.opacity = "1";
                widget.style.transform = "translateY(0)";
            }, 10);
        });
        
        const widgetUrl = `http://localhost:3001/?websiteId=${websiteId}&currentUrl=${currentPageUrl}`;
        
        iframe.src = widgetUrl;

        // Create toggle button
        const toggleButton = document.createElement("img");
        const buttonStyle = toggleButton.style;
        buttonStyle.position = "fixed";
        buttonStyle.bottom = "20px";
        buttonStyle.right = "20px";
        buttonStyle.width = "56px";
        buttonStyle.height = "56px";
        buttonStyle.borderRadius = "50%";
        buttonStyle.border = "none";
        buttonStyle.cursor = "pointer";
        buttonStyle.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        buttonStyle.zIndex = "999999";
        buttonStyle.padding = "14px";
        buttonStyle.backgroundColor = "#0066FF";
        buttonStyle.transition = "all 0.2s ease-in-out";

        // Add hover effect
        toggleButton.addEventListener("mouseover", () => {
            buttonStyle.backgroundColor = "#0052CC"; // Darker shade of the original #0066FF
            buttonStyle.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
        });

        toggleButton.addEventListener("mouseout", () => {
            buttonStyle.backgroundColor = "#0066FF"; // Return to original color
            buttonStyle.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        });

        // Add initial chat icon
        toggleButton.src = iconUrl;
        toggleButton.setAttribute("aria-label", "Toggle chat widget");

        // Down arrow SVG for when modal is open
        const downArrowSvg = `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22lucide%20lucide-chevron-down%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E`;

        // Add media query for mobile devices
        const mediaQuery = window.matchMedia('(max-width: 630px)');
        
        const adjustWidgetForMobile = (e) => {
            if (e.matches) {
                // Mobile styles
                widgetStyle.width = "100%";
                widgetStyle.height = "100%";
                widgetStyle.maxWidth = "100%";
                widgetStyle.maxHeight = "100%";
                widgetStyle.bottom = "0";
                widgetStyle.right = "0";
                widgetStyle.borderRadius = "0";
                iframeStyle.borderRadius = "0";
                
                // Hide toggle button if widget is visible
                if (widget.style.opacity === "1") {
                    toggleButton.style.display = "none";
                }
            } else {
                // Desktop styles
                widgetStyle.width = "85%";
                widgetStyle.maxWidth = "400px";
                widgetStyle.height = "50vh";
                widgetStyle.maxHeight = "647px";
                widgetStyle.bottom = "9%";
                widgetStyle.right = "20px";
                iframeStyle.borderRadius = "12px";
                toggleButton.style.display = "block";
            }
        };

        // Initial check and add listener for screen size changes
        adjustWidgetForMobile(mediaQuery);
        mediaQuery.addListener(adjustWidgetForMobile);

        // Add close button
        const closeButton = document.createElement("button");
        const closeButtonStyle = closeButton.style;
        closeButtonStyle.position = "absolute";
        closeButtonStyle.top = "3%";
        closeButtonStyle.right = "10px";
        closeButtonStyle.width = "30px";
        closeButtonStyle.height = "30px";
        closeButtonStyle.backgroundColor = "transparent";
        closeButtonStyle.border = "none";
        closeButtonStyle.cursor = "pointer";
        closeButtonStyle.zIndex = "999999";
        closeButtonStyle.display = "none";
        closeButtonStyle.fontSize = "20px";
        closeButtonStyle.color = "#666";
        closeButton.innerHTML = "✕";
        
        widget.appendChild(closeButton);

        // Modify toggle button click handler
        toggleButton.addEventListener("click", () => {
            const isVisible = widget.style.opacity === "1";
            if (isVisible) {
                widget.style.opacity = "0";
                widget.style.transform = "translateY(20px)";
                toggleButton.src = iconUrl;
                closeButton.style.display = "none";
                toggleButton.style.display = "block"; // Show toggle button when closing
                setTimeout(() => {
                    widget.style.display = "none";
                }, 300);
            } else {
                widget.style.display = "block";
                toggleButton.src = downArrowSvg;
                closeButton.style.display = "block";
                if (mediaQuery.matches) { // Hide toggle button on mobile when opening
                    toggleButton.style.display = "none";
                }
                setTimeout(() => {
                    widget.style.opacity = "1";
                    widget.style.transform = "translateY(0)";
                }, 10);
            }
        });

        // Modify close button click handler
        closeButton.addEventListener("click", () => {
            widget.style.opacity = "0";
            widget.style.transform = "translateY(20px)";
            toggleButton.src = iconUrl;
            closeButton.style.display = "none";
            toggleButton.style.display = "block"; // Show toggle button when closing
            setTimeout(() => {
                widget.style.display = "none";
            }, 300);
        });

        document.body.appendChild(widget);
        document.body.appendChild(toggleButton);
        
    }
    
    if ( document.readyState === "complete" ) {
        loadWidget();
    } else {
        document.addEventListener("readystatechange", () => {
            if ( document.readyState === "complete" ) {
                loadWidget();
            }
        });
    }

})();