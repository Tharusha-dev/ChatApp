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
        widgetStyle.height = "80vh";
        widgetStyle.maxHeight = "647px";
        widgetStyle.position = "fixed";
        widgetStyle.bottom = "100px";
        widgetStyle.right = "20px";
        widgetStyle.zIndex = "999998";

        const iframe = document.createElement("iframe");
        
        const iframeStyle = iframe.style;
        iframeStyle.boxSizing = "border-box";
        iframeStyle.position = "absolute";
        iframeStyle.right = 0;
        iframeStyle.top = 0;
        iframeStyle.width = "100%";
        iframeStyle.height = "100%";
        iframeStyle.border = 0;
        iframeStyle.margin = 0;
        iframeStyle.padding = 0;

        widget.appendChild(iframe);
        
        iframe.addEventListener("load", () => widgetStyle.display = "block" );
        
        const widgetUrl = `http://localhost:3001/?websiteId=${websiteId}&currentUrl=${currentPageUrl}`;
        
        iframe.src = widgetUrl;

        // Create toggle button
        const toggleButton = document.createElement("img");
        const buttonStyle = toggleButton.style;
        buttonStyle.position = "fixed";
        buttonStyle.bottom = "20px";
        buttonStyle.right = "20px";
        buttonStyle.width = "48px";
        buttonStyle.height = "48px";
        buttonStyle.borderRadius = "50%";
        buttonStyle.border = "none";
        // buttonStyle.backgroundColor = "#2196F3";
        // buttonStyle.color = "white";
        buttonStyle.cursor = "pointer";
        buttonStyle.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        buttonStyle.zIndex = "999999";
        
        // Add chat icon to button (you can replace with your own icon/text)
        toggleButton.src = iconUrl;
        toggleButton.setAttribute("aria-label", "Toggle chat widget");

        // Add click handler
        toggleButton.addEventListener("click", () => {
            const isVisible = widget.style.display === "block";
            widget.style.display = isVisible ? "none" : "block";
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