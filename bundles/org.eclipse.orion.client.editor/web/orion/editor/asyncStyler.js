/******************************************************************************* 
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/
/*jslint browser:true regexp:true*/
/*global define console*/
define([], function() {
	/**
	 * Pushes styles provided by a service into the textView.
	 */
	function AsyncStyler(service, textView) {
		this.initialize(textView);
		var self = this;
		service.addEventListener("orion.edit.highlighter.styleReady", function(e) {
			self.onStyleReady(e);
		});
		this.lineStyles = [];
	}
	AsyncStyler.prototype = {
		initialize: function(textView) {
			this.textView = textView;
			var self = this;
			this._listener = {
				onModelChanging: function(e) {
					self.onModelChanging(e);
				},
				onModelChanged: function(e) {
					self.onModelChanged(e);
				},
				onDestroy: function(e) {
					this.textView = null;
					self.onDestroy(e);
				},
				onLineStyle: function(e) {
					self.onLineStyle(e);
				}
			};
			textView.addEventListener("ModelChanging", this._listener.onModelChanging);
			textView.addEventListener("ModelChanged", this._listener.onModelChanged);
			textView.addEventListener("Destroy", this._listener.onDestroy);
			textView.addEventListener("LineStyle", this._listener.onLineStyle);
		},
		onDestroy: function(e) {
			if (this.textView) {
				this.textView.removeEventListener("ModelChanging", this._listener.onModelChanged);
				this.textView.removeEventListener("ModelChanged", this._listener.onModelChanged);
				this.textView.removeEventListener("Destroy", this._listener.onDestroy);
				this.textView.removeEventListener("LineStyle", this._listener.onLineStyle);
				this.textView = null;
			}
		},
		onModelChanging: function(e) {
			this.startLine = this.textView.getModel().getLineAtOffset(e.start);
		},
		onModelChanged: function(e) {
			var startLine = this.startLine;
			if (e.addedLineCount || e.removedLineCount) {
				Array.prototype.splice.apply(this.lineStyles, [startLine, e.removedLineCount].concat(this._getEmptyStyle(e.addedLineCount)));
			}
		},
		/**
		 * TODO doc orion.edit.highlighter.styleReady
		 */
		onStyleReady: function(e) {
			var style = e.style;
			var min = Number.MAX_VALUE, max = -1;
			for (var lineIndex in style) {
				if (style.hasOwnProperty(lineIndex)) {
//					console.debug("Got style for line# " + lineIndex);
					this.lineStyles[lineIndex] = style[lineIndex];
					min = Math.min(min, lineIndex);
					max = Math.max(max, lineIndex);
				}
			}
			min = Math.max(min, 0);
			max = Math.min(max, this.textView.getModel().getLineCount());
			this.textView.redrawLines(min, max + 1);
		},
		onLineStyle: function(e) {
			var style = this.lineStyles[e.lineIndex];
			if (style) {
				// The ranges property has same shape as orion.textview.LineStyleEvent.ranges except indices are line-relative
				if (style.ranges) { e.ranges = this._toDocumentOffset(style.ranges, e.lineStart); }
				else if (style.style) { e.style = style.style; }
			}
		},
		_getEmptyStyle: function(n) {
			var result = [];
			for (var i=0; i < n; i++) {
				result.push(null);
			}
			return result;
		},
		_toDocumentOffset: function(ranges, lineStart) {
			var len = ranges.length, result = [];
			for (var i=0; i < len; i++) {
				var r = ranges[i];
				result.push({
					start: r.start + lineStart,
					end: r.end + lineStart,
					style: r.style
				});
			}
			return result;
		}
	};
	
	return { AsyncStyler: AsyncStyler };
}, "orion/editor");