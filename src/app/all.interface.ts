export interface VideoSearchParam{
    page_size?: number,
    q?: string,
    type?: number,
    last_element?: any
}

export interface Category{
    id: number,
    title: string,
    selected: boolean
}

export interface ThumbnailSize{
    source_x: number,
    source_y: number,
    source_width: number,
    source_height: number,
    destination_x: number,
    destination_y: number,
    destination_width: number,
    destination_height: number
}