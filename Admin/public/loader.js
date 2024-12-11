(() => {
    
    const script = document.currentScript;

    const loadWidget = () => {
        
        const widget= document.createElement("div");

        const widgetStyle = widget.style;
        widgetStyle.display = "none";
        widgetStyle.boxSizing = "border-box";
        widgetStyle.width = "400px";
        widgetStyle.height = "647px";
        widgetStyle.position = "fixed";
        widgetStyle.bottom = "100px";
        widgetStyle.right = "20px";

        const iframe = document.createElement("iframe");
        
        const iframeStyle = iframe.style;
        iframeStyle.boxSizing = "borderBox";
        iframeStyle.position = "absolute";
        iframeStyle.right = 0;
        iframeStyle.top = 0;
        iframeStyle.width = "100%";
        iframeStyle.height = "100%";
        iframeStyle.border = 0;
        iframeStyle.margin = 0;
        iframeStyle.padding = 0;
        iframeStyle.width = "500px";

        widget.appendChild(iframe);
        
        iframe.addEventListener("load", () => widgetStyle.display = "block" );
        
        const widgetUrl = `http://localhost:3000`;
        
        iframe.src = widgetUrl;

        // Create toggle button
        const toggleButton = document.createElement("button");
        const buttonStyle = toggleButton.style;
        buttonStyle.position = "fixed";
        buttonStyle.bottom = "20px";
        buttonStyle.right = "20px";
        buttonStyle.width = "60px";
        buttonStyle.height = "60px";
        buttonStyle.borderRadius = "50%";
        buttonStyle.border = "none";
        buttonStyle.backgroundColor = "#2196F3";
        buttonStyle.color = "white";
        buttonStyle.cursor = "pointer";
        buttonStyle.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        buttonStyle.zIndex = "999999";
        
        // Add chat icon to button (you can replace with your own icon/text)
        toggleButton.innerHTML = "💬";
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