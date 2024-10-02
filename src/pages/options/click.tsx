import React, { useState } from "react";

export default function Click() {
    const [s, setU] = useState(0)

    return <div onClick={() => setU(s + 1)}>
        {s}
    </div>
}